import { Button } from "@follow/components/ui/button/index.js"
import { Input } from "@follow/components/ui/input/index.js"
import { RadioGroup, RadioGroupItem } from "@follow/components/ui/radio-group/motion.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import type { ActionFeedField, ActionOperation } from "@follow/models/types"
import { cn } from "@follow/utils/utils"
import { Fragment, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ViewSelectContent } from "~/modules/feed/view-select-content"
import { actionActions, useActionByIndex } from "~/store/action"

export const FeedFilter = ({ index }: { index: number }) => {
  const { t } = useTranslation("settings")

  const FeedOptions = useMemo(() => {
    return [
      {
        label: t("actions.action_card.feed_options.status"),
        value: "status",
        type: "status",
      },
      {
        label: t("actions.action_card.feed_options.subscription_view"),
        value: "view",
        type: "view",
      },
      {
        label: t("actions.action_card.feed_options.feed_title"),
        value: "title",
      },
      {
        label: t("actions.action_card.feed_options.feed_category"),
        value: "category",
      },
      {
        label: t("actions.action_card.feed_options.site_url"),
        value: "site_url",
      },
      {
        label: t("actions.action_card.feed_options.feed_url"),
        value: "feed_url",
      },
      {
        label: t("actions.action_card.feed_options.entry_title"),
        value: "entry_title",
      },
      {
        label: t("actions.action_card.feed_options.entry_content"),
        value: "entry_content",
      },
      {
        label: t("actions.action_card.feed_options.entry_url"),
        value: "entry_url",
      },
      {
        label: t("actions.action_card.feed_options.entry_author"),
        value: "entry_author",
      },
      {
        label: t("actions.action_card.feed_options.entry_media_length"),
        value: "entry_media_length",
        type: "number",
      },
    ]
  }, [t])

  const disabled = useActionByIndex(index, (a) => a.result.disabled)
  const condition = useActionByIndex(index, (a) => a.condition)

  const onChange = actionActions.updateByIndex.bind(null, index)
  return (
    <div className="w-full shrink space-y-3 overflow-auto">
      <p className="font-medium text-zinc-500">{t("actions.action_card.when_feeds_match")}</p>
      <div className="flex flex-col gap-2 pl-4">
        <RadioGroup
          value={condition.length > 0 ? "filter" : "all"}
          onValueChange={(value) => {
            onChange((data) => {
              if (value === "all") {
                data.condition = []
              } else {
                data.condition = [[{}]]
              }
            })
          }}
        >
          <RadioGroupItem disabled={disabled} label={t("actions.action_card.all")} value="all" />
          <RadioGroupItem
            disabled={disabled}
            label={t("actions.action_card.custom_filters")}
            value="filter"
          />
        </RadioGroup>
      </div>

      {condition.length > 0 && (
        <div className="pl-6">
          <div className="w-full">
            <GridHeader />
            <div className="mt-2">
              {condition.flatMap((orConditions, orConditionIdx) => {
                return orConditions.map((condition, conditionIdx) => {
                  const change = (key: string, value: string | number) => {
                    onChange((data) => {
                      if (!data.condition[orConditionIdx]) {
                        data.condition[orConditionIdx] = [{}]
                      }
                      data.condition[orConditionIdx][conditionIdx]![key] = value
                    })
                  }
                  const type =
                    FeedOptions.find((option) => option.value === condition.field)?.type || "text"
                  return (
                    <Fragment key={`${orConditionIdx}${conditionIdx}`}>
                      {conditionIdx === 0 && orConditionIdx !== 0 && (
                        <div className="flex h-16 items-center justify-center">
                          <span className="text-text-secondary text-sm uppercase">
                            {t("actions.action_card.or")}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4">
                        <div className="flex items-center justify-between max-sm:flex-row sm:justify-start">
                          <span className="sm:hidden">{t("actions.action_card.field")}</span>
                          <ResponsiveSelect
                            placeholder="Select Field"
                            disabled={disabled}
                            value={condition.field}
                            onValueChange={(value) => change("field", value as ActionFeedField)}
                            items={FeedOptions}
                            triggerClassName="max-sm:w-fit h-8"
                          />
                        </div>
                        <div className="flex items-center justify-between max-sm:flex-row sm:justify-start">
                          <span className="sm:hidden">{t("actions.action_card.operator")}</span>
                          <OperationSelect
                            type={type}
                            disabled={disabled}
                            value={condition.operator}
                            onValueChange={(value) => change("operator", value)}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-4 max-sm:flex-row sm:justify-start">
                          <span className="sm:hidden">{t("actions.action_card.value")}</span>
                          <ValueInput
                            type={type}
                            value={condition.value}
                            onChange={(value) => change("value", value)}
                            disabled={disabled}
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            buttonClassName="w-full sm:hidden"
                            variant="outline"
                            disabled={disabled}
                            onClick={() => {
                              onChange((data) => {
                                data.condition[orConditionIdx]!.push({})
                              })
                            }}
                          >
                            {t("actions.action_card.and")}
                          </Button>
                          <Button
                            variant="outline"
                            buttonClassName="w-full max-sm:hidden"
                            disabled={disabled}
                            onClick={() => {
                              onChange((data) => {
                                data.condition[orConditionIdx]!.push({})
                              })
                            }}
                          >
                            {t("actions.action_card.and")}
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={disabled}
                            onClick={() => {
                              onChange((data) => {
                                if (data.condition[orConditionIdx]!.length === 1) {
                                  data.condition.splice(orConditionIdx, 1)
                                } else {
                                  data.condition[orConditionIdx]!.splice(conditionIdx, 1)
                                }
                              })
                            }}
                          >
                            <i className="i-mgc-delete-2-cute-re size-5 text-zinc-600" />
                          </Button>
                        </div>
                      </div>
                      {conditionIdx !== orConditions.length - 1 && (
                        <div className="relative my-4 flex w-full items-center justify-center">
                          <div className="relative">
                            <span className="text-text-secondary text-sm uppercase">
                              {t("actions.action_card.and")}
                            </span>
                            <div className="bg-border absolute left-1/2 h-[10px] w-px" />
                            <div className="bg-border absolute left-1/2 top-0 h-[10px] w-px -translate-y-full" />
                          </div>
                        </div>
                      )}
                    </Fragment>
                  )
                })
              })}
            </div>
          </div>
          <Button
            variant="outline"
            buttonClassName="mt-4 w-full gap-1 py-1"
            onClick={() => {
              onChange((data) => {
                data.condition.push([{}])
              })
            }}
            disabled={disabled}
          >
            {t("actions.action_card.or")}
          </Button>
        </div>
      )}
    </div>
  )
}

const OperationSelect = ({
  type,
  value,
  onValueChange,
  disabled,
}: {
  type: string
  value?: ActionOperation
  onValueChange?: (value: ActionOperation) => void
  disabled?: boolean
}) => {
  const { t } = useTranslation("settings")

  const OperationOptions = useMemo(() => {
    return [
      {
        label: t("actions.action_card.operation_options.contains"),
        value: "contains",
        types: ["text"],
      },
      {
        label: t("actions.action_card.operation_options.does_not_contain"),
        value: "not_contains",
        types: ["text"],
      },
      {
        label: t("actions.action_card.operation_options.is_equal_to"),
        value: "eq",
        types: ["number", "text", "view", "status"],
      },
      {
        label: t("actions.action_card.operation_options.is_not_equal_to"),
        value: "not_eq",
        types: ["number", "text", "view"],
      },
      {
        label: t("actions.action_card.operation_options.is_greater_than"),
        value: "gt",
        types: ["number"],
      },
      {
        label: t("actions.action_card.operation_options.is_less_than"),
        value: "lt",
        types: ["number"],
      },
      {
        label: t("actions.action_card.operation_options.matches_regex"),
        value: "regex",
        types: ["text"],
      },
    ]
  }, [t])

  const options = OperationOptions.filter((option) => option.types.includes(type))
  if (options.length === 1 && value === undefined) {
    onValueChange?.(options[0]!.value as ActionOperation)
  }
  return (
    <ResponsiveSelect
      placeholder="Select Operation"
      disabled={disabled}
      value={value}
      onValueChange={(value) => onValueChange?.(value as ActionOperation)}
      items={options}
      triggerClassName="h-8 max-sm:w-fit"
    />
  )
}

const ValueInput = ({
  type,
  value,
  onChange,
  disabled,
}: {
  type: string
  value?: string | number
  onChange: (value: string | number) => void
  disabled?: boolean
}) => {
  const { t } = useTranslation()

  switch (type) {
    case "view": {
      return (
        <Select
          disabled={disabled}
          onValueChange={(value) => onChange(value)}
          value={value as string | undefined}
        >
          <CommonSelectTrigger className="max-sm:w-fit" />
          <ViewSelectContent />
        </Select>
      )
    }
    case "status": {
      if (value === undefined) {
        onChange("collected")
      }
      return (
        <Select
          disabled={disabled}
          onValueChange={(value) => onChange(value)}
          value={value as string | undefined}
        >
          <CommonSelectTrigger className="max-sm:w-fit" />
          <SelectContent>
            <SelectItem value="collected">
              <div className="flex items-center gap-2">
                <span>{t("words.starred")}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )
    }
    default: {
      return (
        <Input
          disabled={disabled}
          type={type}
          value={value}
          className="h-8"
          onChange={(e) => onChange(e.target.value)}
        />
      )
    }
  }
}

const CommonSelectTrigger = ({ className }: { className?: string }) => (
  <SelectTrigger className={cn("h-8", className)}>
    <SelectValue />
  </SelectTrigger>
)

const GridHeader = () => {
  const { t } = useTranslation("settings")
  return (
    <div className="text-text-secondary grid grid-cols-4 gap-4 pb-2 text-sm font-medium max-sm:hidden">
      <div className="pl-1">{t("actions.action_card.field")}</div>
      <div className="pl-1">{t("actions.action_card.operator")}</div>
      <div className="pl-1">{t("actions.action_card.value")}</div>
      <div />
    </div>
  )
}
