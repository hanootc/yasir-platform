import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Phone, MessageCircle } from "lucide-react";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  customerPhone: string;
  orderStatus: string;
  onConfirmOrder: () => void;
  onRequestCall: () => void;
}

export function OrderConfirmationModal({
  isOpen,
  onClose,
  orderNumber,
  customerPhone,
  orderStatus,
  onConfirmOrder,
  onRequestCall
}: OrderConfirmationModalProps) {
  const isPending = orderStatus === 'pending';
  const isConfirmed = orderStatus === 'confirmed' || orderStatus === 'shipped' || orderStatus === 'delivered';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-0 shadow-2xl">
        <DialogHeader className="text-center pb-4">
          <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
            isConfirmed ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'
          }`}>
            <CheckCircle className={`w-8 h-8 ${
              isConfirmed ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`} />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            {isConfirmed ? `الطلب #${orderNumber} مؤكد` : `تأكيد الطلب #${orderNumber}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {isConfirmed 
              ? 'تم تأكيد طلبك مسبقاً وهو قيد التنفيذ' 
              : 'هل تريد تأكيد طلبك والمتابعة مع عملية التوصيل؟'
            }
          </p>
          
          <div className="space-y-3 pt-4">
            {isPending ? (
              <>
                <Button 
                  onClick={onConfirmOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
                  data-testid="button-confirm-order"
                >
                  <CheckCircle className="w-5 h-5 ml-2" />
                  تأكيد الطلب
                </Button>
                
                <Button 
                  onClick={onRequestCall}
                  variant="outline"
                  className="w-full border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
                  data-testid="button-request-call"
                >
                  <Phone className="w-5 h-5 ml-2" />
                  أرجو الاتصال بي
                </Button>
              </>
            ) : (
              <Button 
                disabled
                className="w-full bg-red-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg cursor-not-allowed opacity-80"
                data-testid="button-already-confirmed"
              >
                <CheckCircle className="w-5 h-5 ml-2" />
                تم التأكيد مسبقاً
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            رقم الهاتف: {customerPhone}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}