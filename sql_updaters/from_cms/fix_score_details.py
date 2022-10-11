#!/usr/bin/env python3

import json
import psycopg2
import psycopg2.extras
from time import monotonic

con = psycopg2.connect(
    database="allenamenti",
    user="allenamenti",
    password="allenamenti",
    host="localhost",
    port="5432",
)
con.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_READ_COMMITTED)

with con.cursor() as cur:
    cur.execute("SET session_replication_role = replica")
    cur.execute(
        "CREATE TEMPORARY TABLE update_submission_results ("
        "   id integer, "
        "   dataset_id integer, "
        "   score_details jsonb, "
        "   PRIMARY KEY (id, dataset_id)"
        ")"
    )
    cur.execute("SELECT MAX(submission_id) FROM submission_results")
    max_id = cur.fetchone()[0]
    print("Max id is", max_id)
    num_updates = 0
    for batch in range(100):
        lb = max_id * batch // 100
        ub = max_id * (batch + 1) // 100
        print("Batch %d / 100: [%d, %d)" % (batch, lb, ub))
        start = monotonic()
        cur.execute(
            "SELECT submission_id, dataset_id, score_details "
            "FROM submission_results "
            "WHERE submission_id >= %s AND submission_id < %s",
            (lb, ub),
        )
        rows = cur.fetchall()
        print("%d rows fetched..." % len(rows))
        updated = []
        for sub_id, dataset_id, score_details in rows:
            if score_details is None:
                continue
            for item in score_details:
                if "text" in item:
                    if isinstance(item["text"], str):
                        item["text"] = json.loads(item["text"])
                elif "testcases" in item:
                    for testcase in item["testcases"]:
                        if isinstance(testcase["text"], str):
                            testcase["text"] = json.loads(testcase["text"])
                else:
                    print("Unknown format!!", sub_id, dataset_id, score_details)
                if "score_fraction" not in item:
                    if "score" in item and "max_score" in item:
                        score = item["score"]
                        max_score = item["max_score"]
                        if max_score != 0:
                            score_fraction = score / max_score
                        else:
                            if "testcases" in item:
                                if all(
                                    tc.get("outcome", "") == "Correct"
                                    for tc in item["testcases"]
                                ):
                                    score_fraction = 1.0
                                else:
                                    score_fraction = 0.0
                            else:
                                score_fraction = 1.0
                    else:
                        # Subtask score missing, assume not a subtask
                        continue
                    item["score_fraction"] = score_fraction
                    num_updates += 1
            updated += [(sub_id, dataset_id, json.dumps(score_details))]
        print("Inserting %d rows in temp table" % (len(updated)))
        psycopg2.extras.execute_values(
            cur,
            "INSERT INTO update_submission_results (id, dataset_id, score_details) VALUES %s",
            updated,
        )
        duration = monotonic() - start
        print(
            "Took %.3fs, ETA: %.3f (%d updates)"
            % (duration, duration * (100 - batch - 1), num_updates)
        )

    print("Updating actual data")
    cur.execute(
        "UPDATE submission_results S "
        "SET score_details = (SELECT score_details FROM update_submission_results U WHERE U.id = S.submission_id AND U.dataset_id = S.dataset_id) "
        "WHERE EXISTS (SELECT score_details FROM update_submission_results U WHERE U.id = S.submission_id AND U.dataset_id = S.dataset_id)"
    )
    cur.execute("SET session_replication_role = DEFAULT")
    cur.execute("COMMIT")
con.close()
