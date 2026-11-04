import { useState } from 'react';
import { accountService } from '@/data/accountService';
import type { Address } from '@/data/types';
import { useAsync } from '@/hooks/useAsync';
import { AddressCard } from '@/components/address/AddressCard';
import { AddressFormModal } from '@/components/address/AddressFormModal';
import { NewArrivals } from '@/components/product/NewArrivals';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, SectionTab, Skeleton } from '@/components/ui/Surface';
import { useToast } from '@/components/ui/Toast';
import { formatAddress, type AddressDraft } from '@/lib/address';
import s from './Page.module.css';

/** Default address always leads; the rest keep their saved order. */
const sortAddresses = (list: Address[]) => [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

export function AddressPage() {
  const res = useAsync(() => accountService.getAddresses(), []);
  const toast = useToast();
  const [editor, setEditor] = useState<{ open: boolean; address: Address | null }>({ open: false, address: null });
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = res.status === 'success' ? sortAddresses(res.data) : [];
  const update = (next: Address[]) => res.setData(next);

  const openAdd = () => setEditor({ open: true, address: null });
  const openEdit = (a: Address) => setEditor({ open: true, address: a });
  const closeEditor = () => setEditor((e) => ({ ...e, open: false }));

  const save = async (draft: AddressDraft) => {
    const editing = editor.address;
    const next = editing
      ? await accountService.updateAddress(editing.id, draft)
      : await accountService.createAddress(draft);
    update(next);
    closeEditor();
    toast(editing ? 'Address updated' : 'Address added', 'success');
  };

  const makeDefault = async (a: Address) => {
    setBusyId(a.id);
    try {
      update(await accountService.setDefaultAddress(a.id));
      toast('Default address updated', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast((e as Error).message, 'danger');
    } finally {
      setBusyId(null);
    }
  };

  // Removal is confirmed in a dialog first (it can't be undone).
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmRemove = async () => {
    const a = pendingDelete;
    if (!a) return;
    setDeleting(true);
    try {
      const { list: next, removed } = await accountService.deleteAddress(a.id);
      update(next);
      setPendingDelete(null);
      toast(removed.isDefault && next.length ? 'Address removed. Your next address is now the default.' : 'Address removed', 'success');
    } catch (e) {
      toast((e as Error).message, 'danger');
    } finally {
      setDeleting(false);
    }
  };

  // Which address becomes default if the current default is removed.
  const nextDefault = pendingDelete?.isDefault ? list.find((x) => x.id !== pendingDelete.id) : undefined;

  return (
    <div className={s.stack24}>
      <div className={s.tabRow}>
        <SectionTab>My Address</SectionTab>
        {res.status === 'success' && list.length > 0 && (
          <Button variant="outline" size="sm" iconRight="add" onClick={openAdd}>
            Add New Address
          </Button>
        )}
      </div>

      {res.status === 'loading' && (
        <div className={s.twoCol} aria-busy="true" aria-label="Loading addresses">
          {[0, 1].map((i) => (
            <div key={i} style={{ background: '#fff', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton width="40%" />
              <Skeleton width="50%" />
              <Skeleton height={44} />
            </div>
          ))}
        </div>
      )}
      {res.status === 'error' && <ErrorState message={res.error.message} onRetry={res.retry} />}
      {res.status === 'success' &&
        (list.length === 0 ? (
          <EmptyState
            title="No saved addresses yet"
            body="Add an address now so your next checkout is quicker."
            action={{ label: 'Add New Address', onClick: openAdd }}
          />
        ) : (
          <div className={s.twoCol}>
            {list.map((a) => (
              <AddressCard
                key={a.id}
                address={a}
                busy={busyId === a.id || (deleting && pendingDelete?.id === a.id)}
                onEdit={() => openEdit(a)}
                onDelete={() => setPendingDelete(a)}
                onMakeDefault={() => makeDefault(a)}
              />
            ))}
          </div>
        ))}

      <hr className={s.divider} />
      <NewArrivals />

      <Modal
        open={!!pendingDelete}
        title="Remove this address?"
        onClose={() => !deleting && setPendingDelete(null)}
        actions={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button iconRight={deleting ? undefined : 'delete-white'} onClick={confirmRemove} loading={deleting}>
              Remove
            </Button>
          </>
        }
      >
        {pendingDelete && (
          <div className={s.confirmBody}>
            <div className={s.confirmPreview}>
              <p className={s.confirmName}>
                {pendingDelete.name}
                {pendingDelete.isDefault && <Badge tone="brand">Default</Badge>}
              </p>
              <p>{formatAddress(pendingDelete)}</p>
            </div>
            <p>
              {nextDefault
                ? `This is your default address. After removing it, “${nextDefault.line1}” will become your default.`
                : 'You won’t be able to undo this. Past orders delivered here won’t be affected.'}
            </p>
          </div>
        )}
      </Modal>

      <AddressFormModal
        open={editor.open}
        address={editor.address}
        isFirst={list.length === 0}
        onClose={closeEditor}
        onSubmit={save}
      />
    </div>
  );
}
