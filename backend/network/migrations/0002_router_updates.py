# Generated migration for router updates

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='router',
            name='coordinates',
            field=models.CharField(blank=True, help_text='GPS coordinates (lat,lng)', max_length=50),
        ),
        migrations.AddField(
            model_name='router',
            name='snmp_community',
            field=models.CharField(default='public', help_text='SNMP community string', max_length=100),
        ),
        migrations.AddField(
            model_name='router',
            name='snmp_port',
            field=models.IntegerField(default=161, help_text='SNMP port'),
        ),
        migrations.AddField(
            model_name='router',
            name='notes',
            field=models.TextField(blank=True, help_text='Additional notes'),
        ),
        migrations.AlterField(
            model_name='router',
            name='api_port',
            field=models.IntegerField(default=8729, help_text='API port (8729 for MikroTik)'),
        ),
    ]