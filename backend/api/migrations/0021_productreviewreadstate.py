from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0020_productreviewmessage_status_flow'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductReviewReadState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_seen_message', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='read_states', to='api.productreviewmessage')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='review_read_states', to='api.productitem')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='product_review_read_states', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at', '-id'],
            },
        ),
        migrations.AddConstraint(
            model_name='productreviewreadstate',
            constraint=models.UniqueConstraint(fields=('user', 'product'), name='unique_review_read_state_per_user_product'),
        ),
    ]
