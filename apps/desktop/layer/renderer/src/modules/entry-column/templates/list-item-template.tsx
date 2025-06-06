import { useMobile } from "@follow/components/hooks/useMobile.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { clsx, cn, formatEstimatedMins, formatTimeToSeconds, isSafari } from "@follow/utils/utils"
import { useMemo } from "react"

import { AudioPlayer, useAudioPlayerAtomSelector } from "~/atoms/player"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useRealInWideMode, useUISettingKey } from "~/atoms/settings/ui"
import { RelativeTime } from "~/components/ui/datetime"
import { Media } from "~/components/ui/media"
import { FEED_COLLECTION_LIST } from "~/constants"
import { useEntryIsRead } from "~/hooks/biz/useAsRead"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { EntryTranslation } from "~/modules/entry-column/translation"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"
import { useEntry } from "~/store/entry/hooks"
import { getPreferredTitle, useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"

import { StarIcon } from "../star-icon"
import type { UniversalItemProps } from "../types"

export function ListItem({
  entryId,
  entryPreview,
  translation,
  simple,
}: UniversalItemProps & {
  simple?: boolean
}) {
  const isMobile = useMobile()
  const entry = useEntry(entryId) || entryPreview

  const isRead = useEntryIsRead(entry)

  const inInCollection = useRouteParamsSelector((s) => s.feedId === FEED_COLLECTION_LIST)

  const feed =
    useFeedById(entry?.feedId, (feed) => {
      return {
        type: feed.type,
        ownerUserId: feed.ownerUserId,
        id: feed.id,
        title: feed.title,
        url: (feed as any).url || "",
        image: feed.image,
        siteUrl: feed.siteUrl,
      }
    }) || entryPreview?.feeds

  const inbox = useInboxById(entry?.inboxId)

  const settingWideMode = useRealInWideMode()
  const thumbnailRatio = useUISettingKey("thumbnailRatio")
  const rid = `list-item-${entryId}`

  const bilingual = useGeneralSettingKey("translationMode") === "bilingual"
  const lineClamp = useMemo(() => {
    const envIsSafari = isSafari()
    let lineClampTitle = settingWideMode ? 1 : 2
    let lineClampDescription = settingWideMode ? 1 : 2

    if (translation?.title && !simple && bilingual) {
      lineClampTitle += 1
    }
    if (translation?.description && !simple && bilingual) {
      lineClampDescription += 1
    }

    // for tailwind
    // line-clamp-[1] line-clamp-[2] line-clamp-[3] line-clamp-[4] line-clamp-[5] line-clamp-[6] line-clamp-[7] line-clamp-[8]

    // FIXME: Safari bug, not support line-clamp cross elements
    return {
      global: !envIsSafari
        ? `line-clamp-[${simple ? lineClampTitle : lineClampTitle + lineClampDescription}]`
        : "",
      title: envIsSafari ? `line-clamp-[${lineClampTitle}]` : "",
      description: envIsSafari ? `line-clamp-[${lineClampDescription}]` : "",
    }
  }, [settingWideMode, simple, translation?.description, translation?.title, bilingual])

  const audioAttachment = useMemo(() => {
    return entry?.entries?.attachments?.find((a) => a.mime_type?.startsWith("audio") && a.url)
  }, [entry?.entries?.attachments])

  // NOTE: prevent 0 height element, react virtuoso will not stop render any more
  if (!entry || !(feed || inbox)) return null

  const displayTime = inInCollection ? entry.collections?.createdAt : entry.entries.publishedAt

  const related = feed || inbox

  const hasAudio = simple ? false : !!audioAttachment
  const hasMedia = simple ? false : !!entry.entries?.media?.[0]?.url

  const marginWidth = 8 * (isMobile ? 1.125 : 1)
  // calculate the max width to have a correct truncation
  // FIXME: this is not easy to maintain, need to refactor
  const feedIconWidth = 20 + marginWidth
  const audioCoverWidth = settingWideMode ? 65 : 80 + marginWidth
  const mediaWidth = (settingWideMode ? 48 : 80) * (isMobile ? 1.125 : 1) + marginWidth

  let savedWidth = 0

  savedWidth += feedIconWidth

  if (hasAudio) {
    savedWidth += audioCoverWidth
  }
  if (hasMedia && !hasAudio) {
    savedWidth += mediaWidth
  }

  return (
    <div
      className={cn(
        "cursor-menu group relative flex pl-3 pr-2",
        !isRead &&
          "before:bg-accent before:absolute before:-left-0.5 before:top-[1.4375rem] before:block before:size-2 before:rounded-full",
        settingWideMode ? "py-3" : "py-4",
      )}
    >
      <FeedIcon feed={related} fallback entry={entry.entries} />
      <div
        className={cn("-mt-0.5 flex-1 text-sm leading-tight", lineClamp.global)}
        style={{
          maxWidth: `calc(100% - ${savedWidth}px)`,
        }}
      >
        <div
          className={cn(
            "flex gap-1 text-[10px] font-bold",
            "text-text-secondary",
            entry.collections && "text-text-secondary",
          )}
        >
          <EllipsisHorizontalTextWithTooltip className="truncate">
            <FeedTitle
              feed={related}
              title={getPreferredTitle(related, entry.entries)}
              className="space-x-0.5"
            />
          </EllipsisHorizontalTextWithTooltip>
          <span>·</span>
          <span className="shrink-0">{!!displayTime && <RelativeTime date={displayTime} />}</span>
        </div>
        <div
          className={cn(
            "relative my-0.5 break-words",
            "text-text",
            !!entry.collections && "pr-5",
            entry.entries.title ? "font-medium" : "text-[13px]",
          )}
        >
          {entry.entries.title ? (
            <EntryTranslation
              className={cn("hyphens-auto font-semibold", lineClamp.title)}
              source={entry.entries.title}
              target={translation?.title}
            />
          ) : (
            <EntryTranslation
              className={cn("hyphens-auto", lineClamp.description)}
              source={entry.entries.description}
              target={translation?.description}
            />
          )}
          {!!entry.collections && <StarIcon className="absolute right-0 top-0" />}
        </div>
        {!simple && (
          <div className={cn("text-[13px]", "text-text-secondary")}>
            <EntryTranslation
              className={cn("hyphens-auto", lineClamp.description)}
              source={entry.entries.description}
              target={translation?.description}
            />
          </div>
        )}
      </div>

      {hasAudio && (
        <AudioCover
          entryId={entryId}
          src={audioAttachment!.url}
          durationInSeconds={audioAttachment?.duration_in_seconds}
          feedIcon={
            <FeedIcon
              fallback={true}
              fallbackElement={
                <div
                  className={clsx(
                    "bg-material-ultra-thick",
                    settingWideMode ? "size-[65px]" : "size-[80px]",
                    "rounded",
                  )}
                />
              }
              feed={feed || inbox}
              entry={entry.entries}
              size={settingWideMode ? 65 : 80}
              className="m-0 rounded"
              useMedia
              noMargin
            />
          }
        />
      )}

      {!simple && !hasAudio && entry.entries.media?.[0] && (
        <Media
          thumbnail
          src={entry.entries.media[0].url}
          type={entry.entries.media[0].type}
          previewImageUrl={entry.entries.media[0].preview_image_url}
          className={cn(
            "center ml-2 flex shrink-0 rounded",
            settingWideMode ? "size-12" : "size-20",
          )}
          mediaContainerClassName={"w-auto h-auto rounded"}
          loading="lazy"
          key={`${rid}-media-${thumbnailRatio}`}
          proxy={{
            width: 160,
            height: thumbnailRatio === "square" ? 160 : 0,
          }}
          height={entry.entries.media[0].height}
          width={entry.entries.media[0].width}
          blurhash={entry.entries.media[0].blurhash}
        />
      )}
    </div>
  )
}

function AudioCover({
  entryId,
  src,
  durationInSeconds,
  feedIcon,
}: {
  entryId: string
  src: string
  durationInSeconds?: number | string
  feedIcon: React.ReactNode
}) {
  const isMobile = useMobile()
  const playStatus = useAudioPlayerAtomSelector((playerValue) =>
    playerValue.src === src && playerValue.show ? playerValue.status : false,
  )

  const seconds = formatTimeToSeconds(durationInSeconds)
  const estimatedMins = seconds && Math.floor(seconds / 60)

  const handleClickPlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) e.stopPropagation()
    if (!playStatus) {
      // switch this to play
      AudioPlayer.mount({
        type: "audio",
        entryId,
        src,
        currentTime: 0,
      })
    } else {
      // switch between play and pause
      AudioPlayer.togglePlayAndPause()
    }
  }

  return (
    <div className="relative ml-2 shrink-0">
      {feedIcon}

      <div
        className={cn(
          "center absolute inset-0 w-full transition-all duration-200 ease-in-out group-hover:-translate-y-2 group-hover:opacity-100",
          playStatus || isMobile ? "-translate-y-2 opacity-100" : "opacity-0",
        )}
        onClick={handleClickPlay}
      >
        <button
          type="button"
          className="center bg-material-opaque hover:bg-accent size-10 rounded-full opacity-95 hover:text-white hover:opacity-100"
        >
          <i
            className={cn("size-6", {
              "i-mingcute-pause-fill": playStatus && playStatus === "playing",
              "i-mingcute-loading-fill animate-spin": playStatus && playStatus === "loading",
              "i-mingcute-play-fill": !playStatus || playStatus === "paused",
            })}
          />
        </button>
      </div>

      {!!estimatedMins && (
        <div className="absolute bottom-0 w-full overflow-hidden rounded-b-sm text-center">
          <div
            className={cn(
              "bg-material-ultra-thick absolute left-0 top-0 size-full opacity-0 duration-200 group-hover:opacity-100",
              isMobile && "opacity-100",
            )}
          />
          <div
            className={cn(
              "group-hover:backdrop-blur-background text-body opacity-0 backdrop-blur-none duration-200 group-hover:opacity-100",
              isMobile && "backdrop-blur-background opacity-100",
            )}
          >
            {formatEstimatedMins(estimatedMins)}
          </div>
        </div>
      )}
    </div>
  )
}
