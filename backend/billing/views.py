from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from drf_spectacular.utils import extend_schema, OpenApiParameter
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal

from .models import Invoice, Payment, BillingCycle
from .serializers import (
    InvoiceSerializer, InvoiceCreateSerializer, InvoiceListSerializer,
    PaymentSerializer, PaymentCreateSerializer, PaymentListSerializer,
    BillingCycleSerializer
)
from customers.models import Customer
from subscriptions.models import Subscription
from core.responses import APIResponse
from core.performance import cache_result, measure_execution_time


@extend_schema(
    tags=['Billing - Invoices'],
    summary='List Invoices',
    description='Get a paginated list of all invoices with filtering capabilities'
)
class InvoiceListView(generics.ListCreateAPIView):
    """List and create invoices."""
    queryset = Invoice.objects.select_related('customer', 'subscription').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'subscription', 'due_date']
    search_fields = ['invoice_number', 'customer__name', 'customer__email']
    ordering_fields = ['created_at', 'due_date', 'amount', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvoiceCreateSerializer
        return InvoiceListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=start_date)
            except ValueError:
                pass

        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=end_date)
            except ValueError:
                pass

        # Filter by amount range
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')

        if min_amount:
            try:
                min_amount = Decimal(min_amount)
                queryset = queryset.filter(amount__gte=min_amount)
            except (ValueError, TypeError):
                pass

        if max_amount:
            try:
                max_amount = Decimal(max_amount)
                queryset = queryset.filter(amount__lte=max_amount)
            except (ValueError, TypeError):
                pass

        # Filter overdue invoices
        if self.request.query_params.get('overdue') == 'true':
            queryset = queryset.filter(
                due_date__lt=timezone.now().date(),
                status__in=['pending', 'sent']
            )

        return queryset

    def list(self, request, *args, **kwargs):
        """Override list to use custom response format."""
        queryset = self.filter_queryset(self.get_queryset())

        # Get pagination data
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)

            # Convert to our standard format
            return APIResponse.success(
                data=paginated_response.data['results'],
                pagination={
                    'count': paginated_response.data['count'],
                    'next': paginated_response.data['next'],
                    'previous': paginated_response.data['previous']
                },
                message="Invoices retrieved successfully"
            )

        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Invoices retrieved successfully"
        )

    def create(self, request, *args, **kwargs):
        """Override create to use custom response format."""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            invoice = serializer.save()
            response_serializer = InvoiceSerializer(invoice)
            return APIResponse.success(
                data=response_serializer.data,
                message="Invoice created successfully",
                status_code=status.HTTP_201_CREATED
            )
        return APIResponse.validation_error(serializer.errors)


@extend_schema(
    tags=['Billing - Invoices'],
    summary='Invoice Details',
    description='Get, update, or delete a specific invoice'
)
class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an invoice."""
    queryset = Invoice.objects.select_related('customer', 'subscription').all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to use custom response format."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message="Invoice retrieved successfully"
        )

    def update(self, request, *args, **kwargs):
        """Override update to use custom response format."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            invoice = serializer.save()
            return APIResponse.success(
                data=InvoiceSerializer(invoice).data,
                message="Invoice updated successfully"
            )
        return APIResponse.validation_error(serializer.errors)

    def destroy(self, request, *args, **kwargs):
        """Override destroy to use custom response format."""
        instance = self.get_object()

        # Check if invoice can be deleted
        if instance.status in ['paid', 'cancelled']:
            instance.delete()
            return APIResponse.success(
                message="Invoice deleted successfully",
                status_code=status.HTTP_204_NO_CONTENT
            )
        else:
            return APIResponse.error(
                message="Cannot delete invoice with current status",
                status_code=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(
    tags=['Billing - Payments'],
    summary='List Payments',
    description='Get a paginated list of all payments with filtering capabilities'
)
class PaymentListView(generics.ListCreateAPIView):
    """List and create payments."""
    queryset = Payment.objects.select_related('invoice', 'invoice__customer').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'invoice__customer']
    search_fields = ['transaction_id', 'invoice__invoice_number', 'invoice__customer__name']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentCreateSerializer
        return PaymentListSerializer

    def list(self, request, *args, **kwargs):
        """Override list to use custom response format."""
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            paginated_response = self.get_paginated_response(serializer.data)

            return APIResponse.success(
                data=paginated_response.data['results'],
                pagination={
                    'count': paginated_response.data['count'],
                    'next': paginated_response.data['next'],
                    'previous': paginated_response.data['previous']
                },
                message="Payments retrieved successfully"
            )

        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            data=serializer.data,
            message="Payments retrieved successfully"
        )

    def create(self, request, *args, **kwargs):
        """Override create to use custom response format."""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            payment = serializer.save()
            response_serializer = PaymentSerializer(payment)
            return APIResponse.success(
                data=response_serializer.data,
                message="Payment created successfully",
                status_code=status.HTTP_201_CREATED
            )
        return APIResponse.validation_error(serializer.errors)


@extend_schema(
    tags=['Billing - Payments'],
    summary='Payment Details',
    description='Get, update, or delete a specific payment'
)
class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a payment."""
    queryset = Payment.objects.select_related('invoice', 'invoice__customer').all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to use custom response format."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            data=serializer.data,
            message="Payment retrieved successfully"
        )


@extend_schema(
    tags=['Billing - Statistics'],
    summary='Invoice Statistics',
    description='Get comprehensive invoice statistics and analytics'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@cache_result(timeout=300)  # Cache for 5 minutes
@measure_execution_time
def invoice_stats_view(request):
    """Get invoice statistics."""
    try:
        # Date range filtering
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = Invoice.objects.all()

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__gte=start_date)

        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__lte=end_date)

        # Basic counts
        total_invoices = queryset.count()
        pending_invoices = queryset.filter(status='pending').count()
        paid_invoices = queryset.filter(status='paid').count()
        overdue_invoices = queryset.filter(
            due_date__lt=timezone.now().date(),
            status__in=['pending', 'sent']
        ).count()
        cancelled_invoices = queryset.filter(status='cancelled').count()

        # Amount calculations
        total_amount = queryset.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')
        paid_amount = queryset.filter(status='paid').aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')
        pending_amount = queryset.filter(status='pending').aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')
        overdue_amount = queryset.filter(
            due_date__lt=timezone.now().date(),
            status__in=['pending', 'sent']
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')

        # Monthly trends (last 12 months)
        now = timezone.now()
        monthly_data = []

        for i in range(12):
            month_start = (now - relativedelta(months=i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_end = (month_start + relativedelta(months=1)) - timedelta(microseconds=1)

            month_invoices = queryset.filter(
                created_at__range=[month_start, month_end]
            )

            monthly_data.append({
                'month': month_start.strftime('%Y-%m'),
                'invoice_count': month_invoices.count(),
                'total_amount': month_invoices.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0'),
                'paid_amount': month_invoices.filter(status='paid').aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0')
            })

        # Top customers by invoice amount
        top_customers = queryset.values(
            'customer__id', 'customer__name'
        ).annotate(
            total_amount=Sum('total_amount'),
            invoice_count=Count('id')
        ).order_by('-total_amount')[:10]

        # Average invoice amount
        avg_invoice_amount = queryset.aggregate(Avg('total_amount'))['total_amount__avg'] or Decimal('0')

        # Collection efficiency
        collection_rate = (paid_amount / total_amount * 100) if total_amount > 0 else 0

        stats = {
            'totals': {
                'total_invoices': total_invoices,
                'pending_invoices': pending_invoices,
                'paid_invoices': paid_invoices,
                'overdue_invoices': overdue_invoices,
                'cancelled_invoices': cancelled_invoices,
                'total_amount': str(total_amount),
                'paid_amount': str(paid_amount),
                'pending_amount': str(pending_amount),
                'overdue_amount': str(overdue_amount),
                'avg_invoice_amount': str(avg_invoice_amount),
                'collection_rate': round(float(collection_rate), 2)
            },
            'monthly_trends': list(reversed(monthly_data)),
            'top_customers': [
                {
                    'customer_id': customer['customer__id'],
                    'customer_name': customer['customer__name'],
                    'total_amount': str(customer['total_amount']),
                    'invoice_count': customer['invoice_count']
                }
                for customer in top_customers
            ]
        }

        return APIResponse.success(
            data=stats,
            message="Invoice statistics retrieved successfully"
        )

    except Exception as e:
        return APIResponse.error(
            message="Failed to retrieve invoice statistics",
            errors={'detail': str(e)}
        )


@extend_schema(
    tags=['Billing - Statistics'],
    summary='Payment Statistics',
    description='Get comprehensive payment statistics and analytics'
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@cache_result(timeout=300)  # Cache for 5 minutes
@measure_execution_time
def payment_stats_view(request):
    """Get payment statistics."""
    try:
        # Date range filtering
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = Payment.objects.all()

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__gte=start_date)

        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__lte=end_date)

        # Basic counts and amounts
        total_payments = queryset.count()
        successful_payments = queryset.filter(status='completed').count()
        failed_payments = queryset.filter(status='failed').count()
        pending_payments = queryset.filter(status='pending').count()

        total_amount = queryset.aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        successful_amount = queryset.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')

        # Payment method breakdown
        payment_methods = queryset.values('payment_method').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-total_amount')

        # Success rate
        success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0

        # Average payment amount
        avg_payment_amount = queryset.aggregate(Avg('amount'))['amount__avg'] or Decimal('0')

        # Daily payment trends (last 30 days)
        daily_data = []
        for i in range(30):
            date = (timezone.now() - timedelta(days=i)).date()
            day_payments = queryset.filter(created_at__date=date)

            daily_data.append({
                'date': date.isoformat(),
                'payment_count': day_payments.count(),
                'total_amount': str(day_payments.aggregate(Sum('amount'))['amount__sum'] or Decimal('0')),
                'successful_count': day_payments.filter(status='completed').count()
            })

        stats = {
            'totals': {
                'total_payments': total_payments,
                'successful_payments': successful_payments,
                'failed_payments': failed_payments,
                'pending_payments': pending_payments,
                'total_amount': str(total_amount),
                'successful_amount': str(successful_amount),
                'avg_payment_amount': str(avg_payment_amount),
                'success_rate': round(success_rate, 2)
            },
            'payment_methods': [
                {
                    'method': method['payment_method'],
                    'count': method['count'],
                    'total_amount': str(method['total_amount'])
                }
                for method in payment_methods
            ],
            'daily_trends': list(reversed(daily_data))
        }

        return APIResponse.success(
            data=stats,
            message="Payment statistics retrieved successfully"
        )

    except Exception as e:
        return APIResponse.error(
            message="Failed to retrieve payment statistics",
            errors={'detail': str(e)}
        )


@extend_schema(
    tags=['Billing - Operations'],
    summary='Generate Invoice',
    description='Generate invoice for a specific subscription'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_invoice_view(request):
    """Generate an invoice for a subscription."""
    try:
        subscription_id = request.data.get('subscription_id')
        billing_date = request.data.get('billing_date')  # Optional, defaults to today

        if not subscription_id:
            return APIResponse.error(
                message="Subscription ID is required",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        subscription = get_object_or_404(Subscription, id=subscription_id)

        # Parse billing date or use current date
        if billing_date:
            try:
                billing_date = datetime.strptime(billing_date, '%Y-%m-%d').date()
            except ValueError:
                return APIResponse.error(
                    message="Invalid billing_date format. Use YYYY-MM-DD",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        else:
            billing_date = timezone.now().date()

        # Check if invoice already exists for this billing period
        existing_invoice = Invoice.objects.filter(
            subscription=subscription,
            billing_period_start=billing_date
        ).first()

        if existing_invoice:
            return APIResponse.error(
                message="Invoice already exists for this billing period",
                status_code=status.HTTP_409_CONFLICT
            )

        # Create the invoice
        from .services import BillingService
        invoice = BillingService.generate_invoice_for_subscription(subscription, billing_date)

        return APIResponse.success(
            data=InvoiceSerializer(invoice).data,
            message="Invoice generated successfully",
            status_code=status.HTTP_201_CREATED
        )

    except Exception as e:
        return APIResponse.error(
            message="Failed to generate invoice",
            errors={'detail': str(e)}
        )


@extend_schema(
    tags=['Billing - Operations'],
    summary='Send Invoice',
    description='Send invoice to customer via email'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_invoice_view(request, pk):
    """Send an invoice to the customer."""
    try:
        invoice = get_object_or_404(Invoice, pk=pk)

        # Update invoice status to sent
        invoice.status = 'sent'
        invoice.sent_at = timezone.now()
        invoice.save()

        # TODO: Implement actual email sending logic
        # EmailService.send_invoice(invoice)

        return APIResponse.success(
            data=InvoiceSerializer(invoice).data,
            message="Invoice sent successfully"
        )

    except Exception as e:
        return APIResponse.error(
            message="Failed to send invoice",
            errors={'detail': str(e)}
        )


@extend_schema(
    tags=['Billing - Operations'],
    summary='Mark Invoice as Paid',
    description='Mark an invoice as paid and create a payment record'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_invoice_paid_view(request, pk):
    """Mark an invoice as paid."""
    try:
        invoice = get_object_or_404(Invoice, pk=pk)

        if invoice.status == 'paid':
            return APIResponse.error(
                message="Invoice is already marked as paid",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        payment_data = {
            'invoice': invoice.id,
            'amount': request.data.get('amount', invoice.amount),
            'payment_method': request.data.get('payment_method', 'manual'),
            'transaction_id': request.data.get('transaction_id', f"MANUAL_{invoice.invoice_number}"),
            'status': 'completed',
            'notes': request.data.get('notes', 'Manually marked as paid')
        }

        payment_serializer = PaymentCreateSerializer(data=payment_data)
        if payment_serializer.is_valid():
            payment = payment_serializer.save()

            # Update invoice status
            invoice.status = 'paid'
            invoice.paid_at = timezone.now()
            invoice.save()

            return APIResponse.success(
                data={
                    'invoice': InvoiceSerializer(invoice).data,
                    'payment': PaymentSerializer(payment).data
                },
                message="Invoice marked as paid successfully"
            )
        else:
            return APIResponse.validation_error(payment_serializer.errors)

    except Exception as e:
        return APIResponse.error(
            message="Failed to mark invoice as paid",
            errors={'detail': str(e)}
        )


@extend_schema(
    tags=['Billing - Operations'],
    summary='Bulk Generate Invoices',
    description='Generate invoices for multiple customers/subscriptions'
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_generate_invoices_view(request):
    """Bulk generate invoices."""
    try:
        customer_ids = request.data.get('customer_ids', [])
        billing_date = request.data.get('billing_date')

        if billing_date:
            try:
                billing_date = datetime.strptime(billing_date, '%Y-%m-%d').date()
            except ValueError:
                return APIResponse.error(
                    message="Invalid billing_date format. Use YYYY-MM-DD",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        else:
            billing_date = timezone.now().date()

        # Get active subscriptions for the specified customers
        subscriptions = Subscription.objects.filter(
            customer_id__in=customer_ids,
            status='active'
        ) if customer_ids else Subscription.objects.filter(status='active')

        generated_invoices = []
        errors = []

        for subscription in subscriptions:
            try:
                # Check if invoice already exists
                existing_invoice = Invoice.objects.filter(
                    subscription=subscription,
                    billing_period_start=billing_date
                ).first()

                if not existing_invoice:
                    from .services import BillingService
                    invoice = BillingService.generate_invoice_for_subscription(subscription, billing_date)
                    generated_invoices.append(invoice)
                else:
                    errors.append({
                        'subscription_id': subscription.id,
                        'error': 'Invoice already exists for this billing period'
                    })
            except Exception as e:
                errors.append({
                    'subscription_id': subscription.id,
                    'error': str(e)
                })

        return APIResponse.success(
            data={
                'generated_invoices': InvoiceListSerializer(generated_invoices, many=True).data,
                'errors': errors,
                'summary': {
                    'total_subscriptions': subscriptions.count(),
                    'generated_count': len(generated_invoices),
                    'error_count': len(errors)
                }
            },
            message=f"Generated {len(generated_invoices)} invoices successfully"
        )

    except Exception as e:
        return APIResponse.error(
            message="Failed to bulk generate invoices",
            errors={'detail': str(e)}
        )
