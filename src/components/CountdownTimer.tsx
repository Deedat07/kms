import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  dueDate: string;
  status: string;
  className?: string;
}

export function CountdownTimer({ dueDate, status, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const due = new Date(dueDate).getTime();
      const difference = due - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, isOverdue: false });
      } else {
        const overdueDifference = Math.abs(difference);
        const days = Math.floor(overdueDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((overdueDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((overdueDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((overdueDifference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds, isOverdue: true });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [dueDate]);

  if (status === 'closed') {
    return (
      <div className={`flex items-center text-green-600 ${className}`}>
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">Returned</span>
      </div>
    );
  }

  const getTimerColor = () => {
    if (timeLeft.isOverdue) return 'text-red-600';
    if (timeLeft.days === 0 && timeLeft.hours < 2) return 'text-orange-600';
    if (timeLeft.days === 0 && timeLeft.hours < 24) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBackgroundColor = () => {
    if (timeLeft.isOverdue) return 'bg-red-50 border-red-200';
    if (timeLeft.days === 0 && timeLeft.hours < 2) return 'bg-orange-50 border-orange-200';
    if (timeLeft.days === 0 && timeLeft.hours < 24) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const formatTime = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-lg border ${getBackgroundColor()} ${className}`}>
      {timeLeft.isOverdue ? (
        <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />
      ) : (
        <Clock className="h-4 w-4 mr-1" />
      )}
      <span className={`text-sm font-medium ${getTimerColor()}`}>
        {timeLeft.isOverdue ? 'Overdue: ' : ''}
        {formatTime()}
      </span>
    </div>
  );
}