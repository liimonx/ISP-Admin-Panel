from rest_framework import serializers
from .models import RouterMetric, SNMPSnapshot, UsageSnapshot


class RouterMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouterMetric
        fields = '__all__'
        read_only_fields = ('timestamp',)


class SNMPSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = SNMPSnapshot
        fields = '__all__'
        read_only_fields = ('timestamp',)


class UsageSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageSnapshot
        fields = '__all__'
        read_only_fields = ('timestamp',)