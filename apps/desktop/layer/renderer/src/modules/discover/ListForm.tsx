import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardHeader } from "@follow/components/ui/card/index.jsx"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import { FeedViewType } from "@follow/constants"
import type { ListModel } from "@follow/models/types"
import { tracker } from "@follow/tracker"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useI18n } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { tipcClient } from "~/lib/client"
import { getFetchErrorMessage, toastFetchError } from "~/lib/error-parser"
import { getNewIssueUrl } from "~/lib/issues"
import { FollowSummary } from "~/modules/feed/feed-summary"
import { lists as listsQuery, useList } from "~/queries/lists"
import { subscription as subscriptionQuery } from "~/queries/subscriptions"
import { useListById } from "~/store/list"
import { useSubscriptionByFeedId } from "~/store/subscription"
import { feedUnreadActions } from "~/store/unread"

import { useTOTPModalWrapper } from "../profile/hooks"
import { ViewSelectorRadioGroup } from "../shared/ViewSelectorRadioGroup"

const formSchema = z.object({
  view: z.string(),
  category: z.string().nullable().optional(),
  isPrivate: z.boolean().optional(),
  title: z.string().optional(),
})

const defaultValue = { view: FeedViewType.Articles.toString() } as z.infer<typeof formSchema>

export type ListFormDataValuesType = z.infer<typeof formSchema>
export const ListForm: Component<{
  id?: string

  defaultValues?: ListFormDataValuesType

  onSuccess?: () => void
}> = ({ id: _id, defaultValues = defaultValue, onSuccess }) => {
  const queryParams = { id: _id }

  const feedQuery = useList(queryParams)

  const id = feedQuery.data?.list.id || _id
  const list = useListById(id)

  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        "mx-auto min-h-[420px] w-full max-w-[550px] lg:min-w-[550px]",
      )}
    >
      {list ? (
        <ListInnerForm
          {...{
            defaultValues,
            id,

            onSuccess,
            subscriptionData: feedQuery.data?.subscription,
            list,
          }}
        />
      ) : feedQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingCircle size="large" />
        </div>
      ) : feedQuery.error ? (
        <div className="center grow flex-col gap-3">
          <i className="i-mgc-close-cute-re size-7 text-red-500" />
          <p>{t("feed_form.error_fetching_feed")}</p>
          <p className="cursor-text select-text break-all px-8 text-center">
            {getFetchErrorMessage(feedQuery.error)}
          </p>

          <div className="flex items-center gap-4">
            <Button
              variant="text"
              onClick={() => {
                feedQuery.refetch()
              }}
            >
              {t("feed_form.retry")}
            </Button>

            <Button
              variant="primary"
              onClick={() => {
                window.open(
                  getNewIssueUrl({
                    target: "discussion",
                    category: "list-expired",
                    body: [
                      "### Info:",
                      "",
                      "List ID:",
                      "```",
                      id,
                      "```",
                      "",
                      "Error:",
                      "```",
                      getFetchErrorMessage(feedQuery.error),
                      "```",
                    ].join("\n"),
                    title: `Error in fetching list: ${id}`,
                  }),
                  "_blank",
                )
              }}
            >
              {t("feed_form.feedback")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="center h-full grow flex-col">
          <i className="i-mgc-question-cute-re mb-6 size-12 text-zinc-500" />
          <p>{t("feed_form.feed_not_found")}</p>
          <p>{id}</p>
        </div>
      )}
    </div>
  )
}

const ListInnerForm = ({
  defaultValues,
  id,

  onSuccess,
  subscriptionData,
  list,
}: {
  defaultValues?: z.infer<typeof formSchema>
  id?: string

  onSuccess?: () => void
  subscriptionData?: {
    view?: number
    category?: string | null
    isPrivate?: boolean
    title?: string | null
  }
  list: ListModel
}) => {
  const subscription = useSubscriptionByFeedId(id || "") || subscriptionData
  const isSubscribed = !!subscription
  const buttonRef = useRef<HTMLButtonElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      view: list.view.toString(),
    },
  })

  const { setClickOutSideToDismiss, dismiss } = useCurrentModal()

  useEffect(() => {
    setClickOutSideToDismiss(!form.formState.isDirty)
  }, [form.formState.isDirty])

  useEffect(() => {
    if (subscription) {
      form.setValue("view", `${subscription?.view}`)
      form.setValue("isPrivate", subscription?.isPrivate || false)
      form.setValue("title", subscription?.title || "")
    }
  }, [subscription])

  const followMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema> & { TOTPCode?: string }) => {
      const body = {
        listId: list.id,
        view: Number.parseInt(values.view),
        category: values.category,
        isPrivate: values.isPrivate,
        title: values.title,
        TOTPCode: values.TOTPCode,
      }
      const $method = isSubscribed ? apiClient.subscriptions.$patch : apiClient.subscriptions.$post

      return $method({
        json: body,
      })
    },
    onSuccess: (_, variables) => {
      if (isSubscribed && variables.view !== `${subscription?.view}`) {
        feedUnreadActions.fetchUnreadByView(subscription?.view)
      } else {
        feedUnreadActions.fetchUnreadByView(Number.parseInt(variables.view))
      }
      subscriptionQuery.all().invalidate()
      tipcClient?.invalidateQuery(subscriptionQuery.all().key)

      const listId = list.id
      if (listId) {
        listsQuery.byId({ id: listId }).invalidate()
        tipcClient?.invalidateQuery(listsQuery.byId({ id: listId }).key)
      }
      toast(isSubscribed ? t("feed_form.updated") : t("feed_form.followed"), {
        duration: 1000,
      })

      if (!isSubscribed) {
        tracker.subscribe({ listId: list.id, view: Number.parseInt(variables.view) })
      }

      onSuccess?.()
    },
    async onError(err) {
      toastFetchError(err)
    },
  })

  const preset = useTOTPModalWrapper(followMutation.mutateAsync)
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isSubscribed) {
      followMutation.mutate(values)
    } else {
      preset(values)
    }
  }

  const t = useI18n()

  return (
    <div className="flex flex-1 flex-col gap-y-4">
      <Card>
        <CardHeader>
          <FollowSummary feed={list} />
        </CardHeader>
      </Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-y-4">
          <FormField
            control={form.control}
            name="view"
            render={() => (
              <FormItem>
                <FormLabel>{t("feed_form.view")}</FormLabel>

                <ViewSelectorRadioGroup
                  {...form.register("view")}
                  disabled={true}
                  className="opacity-60"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <div>
                  <FormLabel>{t("feed_form.title")}</FormLabel>
                  <FormDescription>{t("feed_form.title_description")}</FormDescription>
                </div>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPrivate"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel>{t("feed_form.private_follow")}</FormLabel>
                    <FormDescription>{t("feed_form.private_follow_description")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      className="shrink-0"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
          {!!list.fee && !isSubscribed && (
            <div>
              <FormLabel className="flex items-center gap-1">
                {t("feed_form.fee")}{" "}
                <div className="ml-2 flex scale-[0.85] items-center gap-1">
                  {list.fee}
                  <i className="i-mgc-power text-accent size-4" />
                </div>
              </FormLabel>
              <FormDescription className="mt-0.5">{t("feed_form.fee_description")}</FormDescription>
            </div>
          )}
          <div className="flex flex-1 items-center justify-end gap-4">
            {isSubscribed && (
              <Button
                type="button"
                ref={buttonRef}
                variant="text"
                onClick={() => {
                  dismiss()
                }}
              >
                {t.common("words.cancel")}
              </Button>
            )}
            <Button ref={buttonRef} type="submit" isLoading={followMutation.isPending}>
              {isSubscribed
                ? t("feed_form.update")
                : list.fee
                  ? t("feed_form.follow_with_fee", {
                      fee: list.fee,
                    })
                  : t("feed_form.follow")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
