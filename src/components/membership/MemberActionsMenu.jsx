import React from 'react';
import { ChevronDown, MailWarning, Receipt, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';

export default function MemberActionsMenu({
  onSendRenewalReminder,
  onSendPaymentReminder,
  onDelete
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2 hover:bg-blue-700 text-white bg-[hsl(var(--primary))]">
          Actions
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onSendRenewalReminder} className="gap-2">
          <MailWarning className="w-4 h-4" />
          Send Renewal Reminder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSendPaymentReminder} className="gap-2">
          <Receipt className="w-4 h-4" />
          Send Payment Reminder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4" />
          Delete Member Record
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);

}