"""Add some constraint that weren't applied by alembic (e.g. because of use_alter=True)

Revision ID: 0e622bed48be
Revises: 08a10b5b0f10
Create Date: 2015-12-24 03:26:50.629730

"""

# revision identifiers, used by Alembic.
revision = '0e622bed48be'
down_revision = '08a10b5b0f10'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_unique_constraint(u'submission_results_submission_id_dataset_id_key', 'submission_results', ['submission_id', 'dataset_id'])
    op.create_foreign_key(u'fk_active_dataset_id', 'tasks', 'datasets', ['id', 'active_dataset_id'], ['task_id', 'id'], onupdate=u'SET NULL', ondelete=u'SET NULL')
    op.create_unique_constraint(u'user_test_results_user_test_id_dataset_id_key', 'user_test_results', ['user_test_id', 'dataset_id'])


def downgrade():
    op.drop_constraint(u'user_test_results_user_test_id_dataset_id_key', 'user_test_results', type_='unique')
    op.drop_constraint(u'fk_active_dataset_id', 'tasks', type_='foreignkey')
    op.drop_constraint(u'submission_results_submission_id_dataset_id_key', 'submission_results', type_='unique')
