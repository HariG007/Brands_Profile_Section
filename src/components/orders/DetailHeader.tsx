import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb, type Crumb } from '@/components/ui/Surface';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import s from './DetailHeader.module.css';

interface Props {
  crumbs: Crumb[];
  title: string;
  backTo: string;
  /** Text copied by the copy button (AWB number). */
  copyValue?: string;
  actions?: ReactNode;
  /** On mobile, move actions into their own full-width row below the header. */
  stackActionsOnMobile?: boolean;
}

export function DetailHeader({ crumbs, title, backTo, copyValue, actions, stackActionsOnMobile }: Props) {
  const toast = useToast();
  const copy = async () => {
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      toast('AWB number copied', 'success');
    } catch {
      toast('Couldn’t copy — please copy it manually', 'danger');
    }
  };
  return (
    <>
      <div className={[s.header, stackActionsOnMobile && s.stackActions].filter(Boolean).join(' ')}>
        <div className={s.left}>
          <Breadcrumb items={crumbs} />
          <div className={s.titleRow}>
            <Link to={backTo} className={s.back} aria-label="Back">
              <Icon name="arrow-circle-left-24" size={24} />
            </Link>
            <h2 className={s.title}>{title}</h2>
            {copyValue && (
              <button className={s.copy} onClick={copy} aria-label="Copy AWB number" title="Copy AWB number">
                <Icon name="copy-all" size={20} />
              </button>
            )}
          </div>
        </div>
        {actions && <div className={s.actions}>{actions}</div>}
      </div>
      {actions && stackActionsOnMobile && <div className={s.mobileActions}>{actions}</div>}
    </>
  );
}
