from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('join/', views.join, name='join'),
    path('chooseMode/', views.chooseMode, name='chooseMode'),
    path('play/', views.playLocal, name='playLocal'),
    path('ai/', views.playAI, name='playAI'),
    path('board/', views.board, name='board'),
    path('reset/', views.resetBoard, name='resetBoard'),
]
