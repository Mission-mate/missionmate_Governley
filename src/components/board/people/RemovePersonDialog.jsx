import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { removePerson } from '@/lib/boardPeopleApi';
import { toast } from '@/components/ui/use-toast';

export default function RemovePersonDialog({ person, isOpen, onClose }) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => removePerson(person.id),
    onSuccess: (result) => {
      ['boardPeople', 'committeeMembers', 'meetingParticipants', 'memberSkills', 'memberAttributes']
        .forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
      const failed = result?.failed || [];
      if (failed.length) {
        toast({
          title: `${person.member_name} was removed, with leftovers`,
          description: `These could not be cleaned up: ${failed.map((f) => f.entity).join(', ')}. Try removing them manually.`,
          variant: 'destructive',
        });
      } else {
        toast({ title: `${person.member_name} was removed`, description: 'All committee, meeting and matrix records were cleaned up.' });
      }
      onClose();
    },
    onError: () => {
      toast({ title: 'Could not remove this person', description: 'Nothing was changed. Please try again.', variant: 'destructive' });
    },
  });

  return (
    <ConfirmTypeDialog
      isOpen={isOpen && !!person}
      title="Remove Person"
      message={`This removes ${person?.member_name || 'this person'} from the board module and all committees. This cannot be undone.`}
      keyword="REMOVE"
      onConfirm={() => mutation.mutateAsync().catch(() => {})}
      onClose={onClose}
    />
  );
}