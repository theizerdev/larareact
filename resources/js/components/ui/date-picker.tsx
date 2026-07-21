import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerProps = Omit<DayPickerProps, 'mode' | 'selected' | 'onSelect'> & {
    value?: Date;
    onChange?: (date?: Date) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

function DatePicker({
    value,
    onChange,
    placeholder = 'Pick a date',
    disabled,
    className,
    ...props
}: DatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !value && 'text-muted-foreground',
                        className,
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, 'PPP') : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    className={cn('p-3')}
                    classNames={{
                        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                        month: 'space-y-4',
                        month_caption:
                            'flex justify-center pt-1 relative items-center',
                        caption_label: 'text-sm font-medium',
                        nav: 'space-x-1 flex items-center',
                        button_previous: cn(
                            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1',
                        ),
                        button_next: cn(
                            'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1',
                        ),
                        month_grid: 'w-full border-collapse space-y-1',
                        weekdays: 'flex',
                        weekday:
                            'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                        week: 'flex w-full mt-2',
                        day: 'h-9 w-9 text-center text-sm p-0 relative',
                        day_button: cn(
                            'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md',
                        ),
                        selected:
                            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                        today: 'bg-accent text-accent-foreground',
                        outside:
                            'text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                        disabled: 'text-muted-foreground opacity-50',
                        hidden: 'invisible',
                    }}
                    {...props}
                />
            </PopoverContent>
        </Popover>
    );
}

export { DatePicker };
