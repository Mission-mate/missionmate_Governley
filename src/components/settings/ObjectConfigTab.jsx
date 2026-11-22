import React, { useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Lock } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { useToast } from '@/components/ui/use-toast';
import EditContactTypeField from './EditContactTypeField';
import CustomFieldEditor from './CustomFieldEditor';
import CustomFieldViewPane from './CustomFieldViewPane';
import { useContactTypeConfig } from '@/hooks/useContactTypeConfig';
import { useCustomFields } from '@/hooks/useCustomFields';
import { saveCustomFields } from '@/lib/customFields';
import { CONTACT_TYPE_FIELD_NAME } from '@/lib/contactTypeConfig';
import { CUSTOM_FIELDS_SUBTEXT } from '@/lib/fieldVisibility';
import { MEMBERSHIP_SYSTEM_CUSTOM_FIELDS } from '@/lib/memberSystemFields';
import ModuleLoader from '@/components/shared/states/ModuleLoader';

function DeleteFieldDialog({ field, onConfirm, onCancel }) {
  const [deleting, setDeleting] = useState(false);
  const handle = async () => {setDeleting(true);await onConfirm();setDeleting(false);};
  return (
    <ModalOverlay isOpen={!!field} onClose={onCancel} className="w-full max-w-sm">
      <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Delete Custom Field</h2>
        <p className="text-sm text-muted-foreground mb-5">
          This will permanently remove <span className="font-bold text-foreground">{field?.name}</span> from this object's configuration.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={handle} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
        </div>
      </div>
    </ModalOverlay>);

}

const HeaderRow = () =>
<div className="flex items-center px-4 py-2.5 bg-secondary/40 border-b border-border">
    <span className="w-6" />
    <span className="flex-1 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Field Name</span>
    <span className="w-56 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Field Type</span>
    <span className="w-24 text-xs font-semibold text-foreground/80 uppercase tracking-wide text-right">Actions</span>
  </div>;


export default function ObjectConfigTab({ objectId, showCustomFields = true }) {
  const { toast } = useToast();
  const { fields, record, refresh, isLoading } = useCustomFields(objectId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [viewField, setViewField] = useState(null);
  const [deleteField, setDeleteField] = useState(null);

  // Locked "Contact Type" field — only shown for the Contacts object.
  const isContacts = objectId === 'contacts';
  const { config: ctConfig, record: ctRecord, refresh: refreshCt, isLoading: ctLoading } = useContactTypeConfig();
  const [showCtEditor, setShowCtEditor] = useState(false);

  const persist = async (nextFields) => {
    await saveCustomFields(record, objectId, nextFields);
    await refresh();
  };

  const openCreate = () => {setEditingField(null);setEditorOpen(true);};
  const openEdit = (field) => {setEditingField(field);setEditorOpen(true);};

  const handleSave = async (fieldData) => {
    const exists = fields.some((f) => f.id === fieldData.id);
    const next = exists ?
    fields.map((f) => f.id === fieldData.id ? fieldData : f) :
    [...fields, fieldData];
    await persist(next);
  };

  const handleDelete = async () => {
    await persist(fields.filter((f) => f.id !== deleteField.id));
    setDeleteField(null);
  };

  const onDragEnd = async (result) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const next = Array.from(fields);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    try {
      await persist(next);
    } catch {
      toast({ title: 'Error', description: 'Failed to reorder fields.', variant: 'destructive' });
    }
  };

  if (!showCustomFields) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">
          Custom fields for this object are now managed from the <span className="font-semibold text-foreground">Custom Fields</span> section.
        </p>
      </div>
    );
  }

  if (isLoading || (isContacts && ctLoading)) {
    return <ModuleLoader />;
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">{CUSTOM_FIELDS_SUBTEXT}</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="w-4 h-4" /> Create Custom Field
        </Button>
      </div>

      {/* Locked Contact Type field (Contacts object only) */}
      {isContacts &&
      <div className="mb-6">
          <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wide mb-2">System</p>
          <div className="border border-border rounded-xl overflow-hidden">
            <HeaderRow />
            <div className="flex items-center px-4 py-3.5 gap-3">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <span className="flex-1 text-sm font-semibold text-foreground">{CONTACT_TYPE_FIELD_NAME}</span>
              <span className="w-56 text-sm text-foreground">{ctConfig.fieldType}</span>
              <div className="w-24 flex items-center justify-end gap-2.5">
                <button onClick={() => setShowCtEditor(true)} title="Edit" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button disabled title="This field is locked" className="text-muted-foreground/30 cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      {/* Locked system fields (Membership object only) — fully locked, no edit/delete */}
      {objectId === 'membership' &&
      <div className="mb-6">
          <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wide mb-2">System</p>
          <div className="border border-border rounded-xl overflow-hidden">
            <HeaderRow />
            {MEMBERSHIP_SYSTEM_CUSTOM_FIELDS.map((f, idx) =>
          <div key={f.id} className={`flex items-center px-4 py-3.5 gap-3 ${idx < MEMBERSHIP_SYSTEM_CUSTOM_FIELDS.length - 1 ? 'border-b border-border' : ''}`}>
                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-muted-foreground">{f.name}</span>
                <span className="w-56 text-sm text-muted-foreground">{f.type}</span>
                <div className="w-24 flex items-center justify-end gap-2.5">
                  <button disabled title="System field — can't be edited" className="text-muted-foreground/30 cursor-not-allowed">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button disabled title="This field is locked" className="text-muted-foreground/30 cursor-not-allowed">
                    <Lock className="w-4 h-4" />
                  </button>
                </div>
              </div>
          )}
          </div>
        </div>
      }

      {/* User custom fields */}
      <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wide mb-2">Custom</p>
      <div className="border border-border rounded-xl overflow-hidden">
        <HeaderRow />
        {fields.length === 0 ?
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No custom fields yet. Click "Create Custom Field" to add one.
          </div> :

        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="custom-fields">
              {(provided) =>
            <div ref={provided.innerRef} {...provided.droppableProps}>
                  {fields.map((field, idx) =>
              <Draggable key={field.id} draggableId={field.id} index={idx}>
                      {(prov, snapshot) =>
                <div
                  ref={prov.innerRef}
                  {...prov.draggableProps}
                  className={`flex items-center px-4 py-3.5 gap-3 bg-background ${idx < fields.length - 1 ? 'border-b border-border' : ''} ${snapshot.isDragging ? 'shadow-lg rounded-lg' : ''}`}>
                  
                          <span {...prov.dragHandleProps} className="cursor-grab text-muted-foreground/40 shrink-0">
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <span className="flex-1 text-sm font-semibold text-foreground">{field.name}</span>
                          <span className="w-56 text-sm text-foreground">{field.type}</span>
                          <div className="w-24 flex items-center justify-end gap-2.5">
                            <button onClick={() => openEdit(field)} title="Edit" className="text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteField(field)} title="Delete" className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                }
                    </Draggable>
              )}
                  {provided.placeholder}
                </div>
            }
            </Droppable>
          </DragDropContext>
        }
      </div>

      <CustomFieldEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        field={editingField}
        onSave={handleSave}
        objectId={objectId} />
      

      <CustomFieldViewPane
        isOpen={!!viewField}
        onClose={() => setViewField(null)}
        field={viewField} />
      

      <DeleteFieldDialog field={deleteField} onConfirm={handleDelete} onCancel={() => setDeleteField(null)} />

      {isContacts &&
      <EditContactTypeField
        isOpen={showCtEditor}
        onClose={() => setShowCtEditor(false)}
        config={ctConfig}
        record={ctRecord}
        onSaved={refreshCt} />

      }
    </div>);

}