import React from 'react';
import { cn } from './Button';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverable?: boolean;
}

export const Card = ({ className, children, hoverable = true, ...props }: CardProps) => {
    return (
        <div
            className={cn(
                'bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all',
                hoverable && 'hover:shadow-xl hover:scale-[1.01]',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-6 pb-2', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-6 pt-2', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-6 pt-4 border-t border-gray-50 bg-gray-50/50', className)} {...props} />
);
