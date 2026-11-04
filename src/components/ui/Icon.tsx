import accountCircle from '@/assets/icons/account-circle.svg';
import accountCircleWhite from '@/assets/icons/account-circle-white.svg';
import globeWhite from '@/assets/icons/globe-location-pin-white.svg';
import package2White from '@/assets/icons/package-2-white.svg';
import chatWhite from '@/assets/icons/chat-paste-go-white.svg';
import helpWhite from '@/assets/icons/help-white.svg';
import accountCircleMuted from '@/assets/icons/account-circle-muted.svg';
import chatPasteGoActive from '@/assets/icons/chat-paste-go-active.svg';
import globeLocationPinActive from '@/assets/icons/globe-location-pin-active.svg';
import helpActive from '@/assets/icons/help-active.svg';
import package2Active from '@/assets/icons/package-2-active.svg';
import account from '@/assets/icons/account.svg';
import arrowCircleLeft from '@/assets/icons/arrow-circle-left.svg';
import arrowCircleLeft24 from '@/assets/icons/arrow-circle-left-24.svg';
import bag from '@/assets/icons/bag.svg';
import add from '@/assets/icons/add.svg';
import arrowOutward from '@/assets/icons/arrow-outward.svg';
import chatBubble from '@/assets/icons/chat-bubble.svg';
import mail from '@/assets/icons/mail.svg';
import call from '@/assets/icons/call.svg';
import deleteIcon from '@/assets/icons/delete.svg';
import deleteWhite from '@/assets/icons/delete-white.svg';
import editMuted from '@/assets/icons/edit-muted.svg';
import editWhite from '@/assets/icons/edit-white.svg';
import starCheck from '@/assets/icons/star-check.svg';
import chatPasteGo from '@/assets/icons/chat-paste-go.svg';
import checkCircle from '@/assets/icons/check-circle.svg';
import chevronDown from '@/assets/icons/chevron-down.svg';
import chevronDownSm from '@/assets/icons/chevron-down-sm.svg';
import chevronRight from '@/assets/icons/chevron-right.svg';
import close from '@/assets/icons/close.svg';
import copyAll from '@/assets/icons/copy-all.svg';
import dehaze from '@/assets/icons/dehaze.svg';
import deployedCodeHistory from '@/assets/icons/deployed-code-history.svg';
import edit from '@/assets/icons/edit.svg';
import facebook from '@/assets/icons/facebook.svg';
import globeLocationPin from '@/assets/icons/globe-location-pin.svg';
import filter from '@/assets/icons/filter.svg';
import help from '@/assets/icons/help.svg';
import idCard from '@/assets/icons/id-card.svg';
import instagram from '@/assets/icons/instagram.svg';
import kidStar from '@/assets/icons/kid-star.svg';
import kidStarFilled from '@/assets/icons/kid-star-filled.svg';
import localMall from '@/assets/icons/local-mall.svg';
import logout from '@/assets/icons/logout.svg';
import menu from '@/assets/icons/menu.svg';
import package2 from '@/assets/icons/package-2.svg';
import replay from '@/assets/icons/replay.svg';
import search from '@/assets/icons/search.svg';
import timelineRail from '@/assets/icons/timeline-rail.svg';
import undo from '@/assets/icons/undo.svg';
import youtube from '@/assets/icons/youtube.svg';

export const icons = {
  'account-circle': accountCircle,
  'account-circle-white': accountCircleWhite,
  'globe-location-pin-white': globeWhite,
  'package-2-white': package2White,
  'chat-paste-go-white': chatWhite,
  'help-white': helpWhite,
  'account-circle-muted': accountCircleMuted,
  'chat-paste-go-active': chatPasteGoActive,
  'globe-location-pin-active': globeLocationPinActive,
  'help-active': helpActive,
  'package-2-active': package2Active,
  account,
  'arrow-circle-left': arrowCircleLeft,
  'arrow-circle-left-24': arrowCircleLeft24,
  bag,
  add,
  'arrow-outward': arrowOutward,
  'chat-bubble': chatBubble,
  mail,
  call,
  delete: deleteIcon,
  'delete-white': deleteWhite,
  'edit-muted': editMuted,
  'edit-white': editWhite,
  'star-check': starCheck,
  'chat-paste-go': chatPasteGo,
  'check-circle': checkCircle,
  'chevron-down': chevronDown,
  'chevron-down-sm': chevronDownSm,
  'chevron-right': chevronRight,
  close,
  'copy-all': copyAll,
  dehaze,
  'deployed-code-history': deployedCodeHistory,
  edit,
  facebook,
  'globe-location-pin': globeLocationPin,
  filter,
  help,
  'id-card': idCard,
  instagram,
  'kid-star': kidStar,
  'kid-star-filled': kidStarFilled,
  'local-mall': localMall,
  logout,
  menu,
  'package-2': package2,
  replay,
  search,
  'timeline-rail': timelineRail,
  undo,
  youtube,
} as const;

export type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Rotation in degrees (the design re-uses chevron-down rotated for up/right). */
  rotate?: number;
  label?: string;
}

export function Icon({ name, size = 20, className, rotate, label }: IconProps) {
  return (
    <img
      src={icons[name]}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={className}
      draggable={false}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        transition: 'transform var(--duration-base) var(--ease-out)',
      }}
    />
  );
}
