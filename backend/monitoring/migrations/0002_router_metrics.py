# Generated migration for router metrics

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0002_router_updates'),
        ('monitoring', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='RouterMetric',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cpu_usage', models.IntegerField(default=0, help_text='CPU usage percentage')),
                ('memory_usage', models.IntegerField(default=0, help_text='Memory usage percentage')),
                ('disk_usage', models.IntegerField(default=0, help_text='Disk usage percentage')),
                ('temperature', models.IntegerField(blank=True, help_text='Temperature in Celsius', null=True)),
                ('total_download', models.BigIntegerField(default=0, help_text='Total download bytes')),
                ('total_upload', models.BigIntegerField(default=0, help_text='Total upload bytes')),
                ('download_speed', models.BigIntegerField(default=0, help_text='Current download speed')),
                ('upload_speed', models.BigIntegerField(default=0, help_text='Current upload speed')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('router', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='metrics', to='network.router')),
            ],
            options={
                'verbose_name': 'Router Metric',
                'verbose_name_plural': 'Router Metrics',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='routermetric',
            index=models.Index(fields=['router', '-timestamp'], name='monitoring_routermetric_router_timestamp_idx'),
        ),
    ]