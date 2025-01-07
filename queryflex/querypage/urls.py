from django.urls import include
from django.urls import path
from querypage import views


urlpatterns = [
    path('', views.home, name='home'),
    path('process-query', views.process_query, name='process_query'), 
    path('update-value', views.update_value, name='update_value'), 
    path('export-query', views.export_query, name='export_query'),
    path('delete-row', views.delete_row, name='delete_row')
    # path('validate-query', views.validate_query, name='validate_query'), 
]
