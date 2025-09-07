"""
Core services for business logic and data aggregation.
"""
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from customers.models import Customer
from subscriptions.models import Subscription
from plans.models import Plan
from network.models import Router
from billing.models import Invoice, Payment


class DashboardService:
    """Service for dashboard statistics and data aggregation."""
    
    @staticmethod
    def get_dashboard_stats():
        """Get comprehensive dashboard statistics."""
        # Customer Statistics
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(status='active').count()
        
        # Subscription Statistics
        total_subscriptions = Subscription.objects.count()
        active_subscriptions = Subscription.objects.filter(status='active').count()
        
        # Revenue Statistics
        total_monthly_revenue = Subscription.objects.filter(
            status='active'
        ).aggregate(
            total=Sum('monthly_fee')
        )['total'] or Decimal('0.00')
        
        # Router Statistics
        total_routers = Router.objects.count()
        online_routers = Router.objects.filter(status='online').count()
        
        # Invoice Statistics
        total_invoices = Invoice.objects.count()
        pending_invoices = Invoice.objects.filter(status='pending').count()
        overdue_invoices = Invoice.objects.filter(status='overdue').count()
        
        # Payment Statistics
        total_payments = Payment.objects.count()
        successful_payments = Payment.objects.filter(status='completed').count()
        
        return {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'total_subscriptions': total_subscriptions,
            'active_subscriptions': active_subscriptions,
            'total_monthly_revenue': total_monthly_revenue,
            'total_routers': total_routers,
            'online_routers': online_routers,
            'total_invoices': total_invoices,
            'pending_invoices': pending_invoices,
            'overdue_invoices': overdue_invoices,
            'total_payments': total_payments,
            'successful_payments': successful_payments,
        }
    
    @staticmethod
    def get_customer_stats():
        """Get customer statistics."""
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(status='active').count()
        inactive_customers = Customer.objects.filter(status='inactive').count()
        suspended_customers = Customer.objects.filter(status='suspended').count()
        cancelled_customers = Customer.objects.filter(status='cancelled').count()
        
        # New customers this month
        this_month = timezone.now().replace(day=1)
        new_customers_this_month = Customer.objects.filter(
            created_at__gte=this_month
        ).count()
        
        # Customers with active subscriptions
        customers_with_active_subscriptions = Customer.objects.filter(
            subscriptions__status='active'
        ).distinct().count()
        
        return {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'inactive_customers': inactive_customers,
            'suspended_customers': suspended_customers,
            'cancelled_customers': cancelled_customers,
            'new_customers_this_month': new_customers_this_month,
            'customers_with_active_subscriptions': customers_with_active_subscriptions,
        }
    
    @staticmethod
    def get_subscription_stats():
        """Get subscription statistics."""
        total_subscriptions = Subscription.objects.count()
        active_subscriptions = Subscription.objects.filter(status='active').count()
        inactive_subscriptions = Subscription.objects.filter(status='inactive').count()
        suspended_subscriptions = Subscription.objects.filter(status='suspended').count()
        cancelled_subscriptions = Subscription.objects.filter(status='cancelled').count()
        pending_subscriptions = Subscription.objects.filter(status='pending').count()
        
        # New subscriptions this month
        this_month = timezone.now().replace(day=1)
        new_subscriptions_this_month = Subscription.objects.filter(
            created_at__gte=this_month
        ).count()
        
        # Total monthly revenue
        total_monthly_revenue = Subscription.objects.filter(
            status='active'
        ).aggregate(
            total=Sum('monthly_fee')
        )['total'] or Decimal('0.00')
        
        return {
            'total_subscriptions': total_subscriptions,
            'active_subscriptions': active_subscriptions,
            'inactive_subscriptions': inactive_subscriptions,
            'suspended_subscriptions': suspended_subscriptions,
            'cancelled_subscriptions': cancelled_subscriptions,
            'pending_subscriptions': pending_subscriptions,
            'new_subscriptions_this_month': new_subscriptions_this_month,
            'total_monthly_revenue': total_monthly_revenue,
        }
    
    @staticmethod
    def get_plan_stats():
        """Get plan statistics."""
        total_plans = Plan.objects.count()
        active_plans = Plan.objects.filter(is_active=True).count()
        featured_plans = Plan.objects.filter(is_featured=True).count()
        popular_plans = Plan.objects.filter(is_popular=True).count()
        
        # Most popular plan by subscription count
        most_popular_plan = Plan.objects.annotate(
            subscription_count=Count('subscriptions')
        ).order_by('-subscription_count').first()
        most_popular_plan_name = most_popular_plan.name if most_popular_plan else 'N/A'
        
        # Highest revenue plan
        highest_revenue_plan = Plan.objects.annotate(
            revenue=Sum('subscriptions__monthly_fee', filter=Q(subscriptions__status='active'))
        ).order_by('-revenue').first()
        highest_revenue_plan_name = highest_revenue_plan.name if highest_revenue_plan else 'N/A'
        
        # Total monthly revenue
        total_monthly_revenue = Plan.objects.aggregate(
            total=Sum('subscriptions__monthly_fee', filter=Q(subscriptions__status='active'))
        )['total'] or Decimal('0.00')
        
        return {
            'total_plans': total_plans,
            'active_plans': active_plans,
            'featured_plans': featured_plans,
            'popular_plans': popular_plans,
            'most_popular_plan': most_popular_plan_name,
            'highest_revenue_plan': highest_revenue_plan_name,
            'total_monthly_revenue': total_monthly_revenue,
        }
    
    @staticmethod
    def get_router_stats():
        """Get router statistics."""
        total_routers = Router.objects.count()
        online_routers = Router.objects.filter(status='online').count()
        offline_routers = Router.objects.filter(status='offline').count()
        maintenance_routers = Router.objects.filter(status='maintenance').count()
        mikrotik_routers = Router.objects.filter(router_type='mikrotik').count()
        cisco_routers = Router.objects.filter(router_type='cisco').count()
        other_routers = Router.objects.filter(router_type='other').count()
        
        # Total bandwidth usage
        total_bandwidth_usage = Subscription.objects.filter(
            status='active'
        ).aggregate(
            total=Sum('data_used')
        )['total'] or Decimal('0.00')
        
        return {
            'total_routers': total_routers,
            'online_routers': online_routers,
            'offline_routers': offline_routers,
            'maintenance_routers': maintenance_routers,
            'mikrotik_routers': mikrotik_routers,
            'cisco_routers': cisco_routers,
            'other_routers': other_routers,
            'total_bandwidth_usage': total_bandwidth_usage,
        }
    
    @staticmethod
    def get_invoice_stats():
        """Get invoice statistics."""
        total_invoices = Invoice.objects.count()
        pending_invoices = Invoice.objects.filter(status='pending').count()
        paid_invoices = Invoice.objects.filter(status='paid').count()
        overdue_invoices = Invoice.objects.filter(status='overdue').count()
        cancelled_invoices = Invoice.objects.filter(status='cancelled').count()
        
        # Amount statistics
        total_amount = Invoice.objects.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        paid_amount = Invoice.objects.filter(status='paid').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        pending_amount = Invoice.objects.filter(status='pending').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        overdue_amount = Invoice.objects.filter(status='overdue').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        
        # Average invoice amount
        avg_invoice_amount = Invoice.objects.aggregate(avg=Avg('total_amount'))['avg'] or Decimal('0.00')
        
        # Collection rate
        collection_rate = (paid_amount / total_amount * 100) if total_amount > 0 else 0
        
        return {
            'total_invoices': total_invoices,
            'pending_invoices': pending_invoices,
            'paid_invoices': paid_invoices,
            'overdue_invoices': overdue_invoices,
            'cancelled_invoices': cancelled_invoices,
            'total_amount': total_amount,
            'paid_amount': paid_amount,
            'pending_amount': pending_amount,
            'overdue_amount': overdue_amount,
            'avg_invoice_amount': avg_invoice_amount,
            'collection_rate': collection_rate,
        }
    
    @staticmethod
    def get_payment_stats():
        """Get payment statistics."""
        total_payments = Payment.objects.count()
        successful_payments = Payment.objects.filter(status='completed').count()
        failed_payments = Payment.objects.filter(status='failed').count()
        pending_payments = Payment.objects.filter(status='pending').count()
        
        # Amount statistics
        total_amount = Payment.objects.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        successful_amount = Payment.objects.filter(status='completed').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        # Average payment amount
        avg_payment_amount = Payment.objects.aggregate(avg=Avg('amount'))['avg'] or Decimal('0.00')
        
        # Success rate
        success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0
        
        return {
            'total_payments': total_payments,
            'successful_payments': successful_payments,
            'failed_payments': failed_payments,
            'pending_payments': pending_payments,
            'total_amount': total_amount,
            'successful_amount': successful_amount,
            'avg_payment_amount': avg_payment_amount,
            'success_rate': success_rate,
        }
    
    @staticmethod
    def get_monthly_trends(months=12):
        """Get monthly trend data for the last N months."""
        trends = []
        current_date = timezone.now().replace(day=1)
        
        for i in range(months):
            month_start = current_date - timedelta(days=30 * i)
            month_end = month_start + timedelta(days=30)
            
            # Invoice data
            invoice_count = Invoice.objects.filter(
                issue_date__gte=month_start,
                issue_date__lt=month_end
            ).count()
            
            total_amount = Invoice.objects.filter(
                issue_date__gte=month_start,
                issue_date__lt=month_end
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            paid_amount = Invoice.objects.filter(
                issue_date__gte=month_start,
                issue_date__lt=month_end,
                status='paid'
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            # Payment data
            payment_count = Payment.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).count()
            
            successful_payment_count = Payment.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
                status='completed'
            ).count()
            
            trends.append({
                'month': month_start.strftime('%B'),
                'year': month_start.year,
                'invoice_count': invoice_count,
                'total_amount': total_amount,
                'paid_amount': paid_amount,
                'payment_count': payment_count,
                'successful_payment_count': successful_payment_count,
            })
        
        return list(reversed(trends))
    
    @staticmethod
    def get_daily_trends(days=30):
        """Get daily trend data for the last N days."""
        trends = []
        current_date = timezone.now().date()
        
        for i in range(days):
            date = current_date - timedelta(days=i)
            
            # Payment data
            payment_count = Payment.objects.filter(
                created_at__date=date
            ).count()
            
            total_amount = Payment.objects.filter(
                created_at__date=date
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            successful_count = Payment.objects.filter(
                created_at__date=date,
                status='completed'
            ).count()
            
            # Invoice data
            invoice_count = Invoice.objects.filter(
                issue_date=date
            ).count()
            
            trends.append({
                'date': date,
                'payment_count': payment_count,
                'total_amount': total_amount,
                'successful_count': successful_count,
                'invoice_count': invoice_count,
            })
        
        return list(reversed(trends))
    
    @staticmethod
    def get_payment_method_stats():
        """Get payment method statistics."""
        stats = []
        
        for method, _ in Payment.PaymentMethod.choices:
            method_payments = Payment.objects.filter(payment_method=method)
            count = method_payments.count()
            total_amount = method_payments.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            successful_count = method_payments.filter(status='completed').count()
            success_rate = (successful_count / count * 100) if count > 0 else 0
            
            stats.append({
                'method': method,
                'count': count,
                'total_amount': total_amount,
                'success_rate': success_rate,
            })
        
        return sorted(stats, key=lambda x: x['count'], reverse=True)
    
    @staticmethod
    def get_top_customers(limit=10):
        """Get top customers by total amount."""
        customers = Customer.objects.annotate(
            total_amount=Sum('invoices__total_amount'),
            invoice_count=Count('invoices'),
            subscription_count=Count('subscriptions')
        ).order_by('-total_amount')[:limit]
        
        return [
            {
                'customer_id': customer.id,
                'customer_name': customer.name,
                'total_amount': customer.total_amount or Decimal('0.00'),
                'invoice_count': customer.invoice_count,
                'subscription_count': customer.subscription_count,
            }
            for customer in customers
        ]
