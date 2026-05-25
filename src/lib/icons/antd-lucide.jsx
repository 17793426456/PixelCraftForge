/**
 * 原 @ant-design/icons 名称 → lucide-react，便于无痛替换 import 路径
 */
import { forwardRef } from 'react'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowLeftRight,
  Box, Building2, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, CirclePause, CirclePlay, CloudUpload, Code, Columns, Copy,
  Download, Eraser, Expand, ExternalLink, Eye, EyeOff, FileImage, FileText,
  Folder, FolderOpen, Grid3x3, Highlighter, ImagePlay, Inbox, Info, KeyRound,
  LayoutGrid, Lightbulb, Loader2, Lock, Minus, Moon, Paintbrush, Palette,
  Pencil, Play, Plus, Redo, Rocket, Rows, Save, Scissors, Search,
  Settings, SkipBack, SkipForward, Square, Trash2, Undo, Unlock, Upload,
  Video, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function icon(Icon, { spin, className, style, ...props } = {}) {
  return <Icon className={cn(spin && 'animate-spin', className)} style={style} {...props} />
}

export const LoadingOutlined = forwardRef(function LoadingOutlined({ spin = true, className, ...props }, ref) {
  return <Loader2 ref={ref} className={cn(spin !== false && 'animate-spin', className)} {...props} />
})

export const SearchOutlined = (p) => icon(Search, p)
export const DownloadOutlined = (p) => icon(Download, p)
export const AppstoreOutlined = (p) => icon(LayoutGrid, p)
export const SaveOutlined = (p) => icon(Save, p)
export const ExpandOutlined = (p) => icon(Expand, p)
export const ArrowDownOutlined = (p) => icon(ArrowDown, p)
export const ArrowLeftOutlined = (p) => icon(ArrowLeft, p)
export const ArrowRightOutlined = (p) => icon(ArrowRight, p)
export const ArrowUpOutlined = (p) => icon(ArrowUp, p)
export const CaretLeftOutlined = (p) => icon(ChevronLeft, p)
export const CaretRightOutlined = (p) => icon(ChevronRight, p)
export const DeleteOutlined = (p) => icon(Trash2, p)
export const DragOutlined = (p) => icon(ArrowLeftRight, p)
export const MinusOutlined = (p) => icon(Minus, p)
export const PlusOutlined = (p) => icon(Plus, p)
export const StepBackwardOutlined = (p) => icon(SkipBack, p)
export const StepForwardOutlined = (p) => icon(SkipForward, p)
export const ThunderboltOutlined = (p) => icon(Zap, p)
export const PlayCircleOutlined = (p) => icon(CirclePlay, p)
export const PauseCircleOutlined = (p) => icon(CirclePause, p)
export const ReloadOutlined = (p) => icon(Redo, p)
export const FolderOpenOutlined = (p) => icon(FolderOpen, p)
export const EyeOutlined = (p) => icon(Eye, p)
export const EyeInvisibleOutlined = (p) => icon(EyeOff, p)
export const ZoomInOutlined = (p) => icon(Plus, p)
export const ZoomOutOutlined = (p) => icon(Minus, p)
export const KeyOutlined = (p) => icon(KeyRound, p)
export const CodeOutlined = (p) => icon(Code, p)
export const SwapOutlined = (p) => icon(ArrowLeftRight, p)
export const ExportOutlined = (p) => icon(ExternalLink, p)
export const InboxOutlined = (p) => icon(Inbox, p)
export const FolderOutlined = (p) => icon(Folder, p)
export const UploadOutlined = (p) => icon(Upload, p)
export const ScissorOutlined = (p) => icon(Scissors, p)
export const CheckCircleOutlined = (p) => icon(CheckCircle, p)
export const SettingOutlined = (p) => icon(Settings, p)
export const CloudUploadOutlined = (p) => icon(CloudUpload, p)
export const VideoCameraOutlined = (p) => icon(Video, p)
export const BlockOutlined = (p) => icon(Box, p)
export const BgColorsOutlined = (p) => icon(Palette, p)
export const ClearOutlined = (p) => icon(Eraser, p)
export const FileGifOutlined = (p) => icon(ImagePlay, p)
export const MoonOutlined = (p) => icon(Moon, p)
export const QuestionCircleOutlined = (p) => icon(CircleHelp, p)
export const ToolOutlined = (p) => icon(Settings, p)
export const FormatPainterOutlined = (p) => icon(Paintbrush, p)
export const EditOutlined = (p) => icon(Pencil, p)
export const UndoOutlined = (p) => icon(Undo, p)
export const RedoOutlined = (p) => icon(Redo, p)
export const CopyOutlined = (p) => icon(Copy, p)
export const LockOutlined = (p) => icon(Lock, p)
export const UnlockOutlined = (p) => icon(Unlock, p)
export const HighlightOutlined = (p) => icon(Highlighter, p)
export const PictureOutlined = (p) => icon(FileImage, p)
export const InfoCircleOutlined = (p) => icon(Info, p)
export const RightOutlined = (p) => icon(ChevronRight, p)
export const DownOutlined = (p) => icon(ChevronDown, p)
export const BorderOutlined = (p) => icon(Grid3x3, p)
export const ColumnWidthOutlined = (p) => icon(Columns, p)
export const BulbOutlined = (p) => icon(Lightbulb, p)
export const PlaySquareOutlined = (p) => icon(Play, p)
export const TableOutlined = (p) => icon(Grid3x3, p)
export const ApartmentOutlined = (p) => icon(Building2, p)
export const ColumnHeightOutlined = (p) => icon(Rows, p)
export const BorderOuterOutlined = (p) => icon(Square, p)
export const RocketOutlined = (p) => icon(Rocket, p)
export const FileTextOutlined = (p) => icon(FileText, p)
export const FileImageOutlined = (p) => icon(FileImage, p)
