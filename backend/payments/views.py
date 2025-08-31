from rest_framework.views import APIView
from rest_framework.response import Response


class PaymentMethodListView(APIView):
    def get(self, request):
        return Response({"message": "PaymentMethodListView placeholder"})


payment_methods_view = PaymentMethodListView.as_view()


class PaymentMethodDetailView(APIView):
    def get(self, request, pk):
        return Response({"message": f"PaymentMethodDetailView placeholder for id {pk}"})


class PaymentTransactionListView(APIView):
    def get(self, request):
        return Response({"message": "PaymentTransactionListView placeholder"})


class PaymentTransactionDetailView(APIView):
    def get(self, request, pk):
        return Response({"message": f"PaymentTransactionDetailView placeholder for id {pk}"})


class WebhookEventListView(APIView):
    def get(self, request):
        return Response({"message": "WebhookEventListView placeholder"})


class WebhookEventDetailView(APIView):
    def get(self, request, pk):
        return Response({"message": f"WebhookEventDetailView placeholder for id {pk}"})


class WebhookStripeView(APIView):
    def post(self, request):
        return Response({"message": "WebhookStripeView placeholder"})


webhook_stripe_view = WebhookStripeView.as_view()


class WebhookBkashView(APIView):
    def post(self, request):
        return Response({"message": "WebhookBkashView placeholder"})


webhook_bkash_view = WebhookBkashView.as_view()


class WebhookSSLCommerzView(APIView):
    def post(self, request):
        return Response({"message": "WebhookSSLCommerzView placeholder"})


webhook_sslcommerz_view = WebhookSSLCommerzView.as_view()