import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Committee dropdown for the Meeting Attendance tab.
 * "all" shows attendance across every committee's meetings.
 */
export default function CommitteeSelector({ value, onChange, committees }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-[220px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Committees</SelectItem>
        {committees.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}