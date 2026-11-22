import React from 'react';
import { BookUser } from 'lucide-react';
import CircleCheck from '@/components/shared/CircleCheck';
import EmptyState from '@/components/shared/states/EmptyState';
import { LoaderOne } from '@/components/ui/loaders';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useContactTypeConfig } from '@/hooks/useContactTypeConfig';
import { CONTACT_TYPE_FIELD_ID, CONTACT_TYPE_BADGE_CLASSES } from '@/lib/contactTypeConfig';
import TagPills from '@/components/shared/tags/TagPills';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';

/** Single-select register table: onToggle(id) selects that row (or clears it when it is already selected). */
export default function ContactsTable({ contacts, isLoading, selectedId = null, onToggle = () => {}, onView = () => {} }) {
  const { config: ctConfig } = useContactTypeConfig();

  // Resolve a contact's Contact Type custom-field value into displayable labels.
  const getTypeLabels = (contact) => {
    const raw = contact.custom_fields?.[CONTACT_TYPE_FIELD_ID];
    const values = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    return values.map((v) => ctConfig.options.find((o) => o.value === v)?.label || v);
  };

  if (isLoading) {
    return (
      <div className="border border-border rounded-xl bg-card py-16 flex justify-center">
        <LoaderOne size="lg" />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-secondary/40 hover:bg-secondary/40">
            <TableHead className="w-12" aria-label="Select" />
            <TableHead className="w-[22%]">
              Name
            </TableHead>
            <TableHead className="w-[20%]">
              Email
            </TableHead>
            <TableHead className="w-[20%]">
              Contact Number
            </TableHead>
            <TableHead className="w-[20%]">
              Type
            </TableHead>
            <TableHead className="w-[18%]">
              Tags
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const selected = contact.id === selectedId;
            return (
              <tr
                key={contact.id}
                onClick={() => onView(contact)}
                className={cn(
                  "group border-b border-border last:border-0 transition-colors cursor-pointer",
                  selected ? "bg-primary/10" : "hover:bg-sidebar-accent/70"
                )}
              >
                <TableCell onClick={e => e.stopPropagation()}>
                  {!contact.__isSample && (
                    <CircleCheck
                      checked={selected}
                      onChange={() => onToggle(contact.id)}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <PersonInitialsAvatar name={`${contact.first_name || ''} ${contact.last_name || ''}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {contact.__isSample && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                            Sample
                          </span>
                        )}
                      </div>
                      {contact.company && (
                        <p className="text-xs text-muted-foreground mt-0.5">{contact.company}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-foreground">{contact.email || '–'}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-foreground">{contact.phone || '–'}</p>
                </TableCell>
                <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getTypeLabels(contact).length === 0 ? (
                        <span className="text-xs text-muted-foreground">–</span>
                      ) : (
                        getTypeLabels(contact).map((label) => (
                          <Badge
                            key={label}
                            variant="outline"
                            className={CONTACT_TYPE_BADGE_CLASSES}
                          >
                            {label}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                <TableCell>
                  <TagPills ids={contact.tags} />
                </TableCell>
              </tr>
            );
          })}
          {contacts.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="p-0">
                <EmptyState
                  icon={BookUser}
                  title="No contacts yet"
                  description="Add your first contact to start building your database."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}