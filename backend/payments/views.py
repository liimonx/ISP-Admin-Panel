from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from billing.models import Payment
from billing.serializers import PaymentSerializer, PaymentListSerializer, PaymentCreateSerializer
from core.responses import APIResponse, paginate_response


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payments.
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'customer', 'invoice']
    search_fields = ['payment_number', 'customer__name', 'invoice__invoice_number']
    ordering_fields = ['created_at', 'payment_date', 'amount']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return PaymentListSerializer
        elif self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    def list(self, request, *args, **kwargs):
        """List payments with pagination."""
        queryset = self.filter_queryset(self.get_queryset())
        return paginate_response(
            queryset, request, self.get_serializer_class()
        )

    def create(self, request, *args, **kwargs):
        """Create a new payment."""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            payment = serializer.save()
            return APIResponse.success(
                data=PaymentSerializer(payment).data,
                message="Payment created successfully",
                status_code=status.HTTP_201_CREATED
            )
        return APIResponse.validation_error(serializer.errors)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a payment."""
        try:
            payment = self.get_object()
            serializer = self.get_serializer(payment)
            return APIResponse.success(data=serializer.data)
        except Payment.DoesNotExist:
            return APIResponse.not_found("Payment not found")

    def update(self, request, *args, **kwargs):
        """Update a payment."""
        try:
            payment = self.get_object()
            serializer = self.get_serializer(payment, data=request.data, partial=True)
            if serializer.is_valid():
                payment = serializer.save()
                return APIResponse.success(
                    data=PaymentSerializer(payment).data,
                    message="Payment updated successfully"
                )
            return APIResponse.validation_error(serializer.errors)
        except Payment.DoesNotExist:
            return APIResponse.not_found("Payment not found")

    def destroy(self, request, *args, **kwargs):
        """Delete a payment."""
        try:
            payment = self.get_object()
            payment.delete()
            return APIResponse.success(
                message="Payment deleted successfully",
                status_code=status.HTTP_204_NO_CONTENT
            )
        except Payment.DoesNotExist:
            return APIResponse.not_found("Payment not found")

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark payment as completed."""
        try:
            payment = self.get_object()
            payment.mark_as_completed()
            return APIResponse.success(
                data=PaymentSerializer(payment).data,
                message="Payment marked as completed"
            )
        except Payment.DoesNotExist:
            return APIResponse.not_found("Payment not found")

    @action(detail=True, methods=['post'])
    def mark_failed(self, request, pk=None):
        """Mark payment as failed."""
        try:
            payment = self.get_object()
            payment.mark_as_failed()
            return APIResponse.success(
                data=PaymentSerializer(payment).data,
                message="Payment marked as failed"
            )
        except Payment.DoesNotExist:
            return APIResponse.not_found("Payment not found")

    @action(detail=True, methods=['post'])
    def mark_refunded(self, request, pk=None):
        """Mark payment as refunded."""
        try:
            payment = self.get_object()
            payment.mark_as_refunded()
            return APIResponse.success(
                data=PaymentSerializer(payment).data,
                message="Payment marked as refunded"
            )
        except Payment.DoesNotExist:
            return APIResponse.not_found("Payment not found")