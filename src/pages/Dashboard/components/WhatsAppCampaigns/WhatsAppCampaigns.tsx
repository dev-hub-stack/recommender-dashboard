import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../../components/ui/button";
import {
  createWhatsAppCampaignDraft,
  createMasterWhatsAppRecommendationTemplate,
  getWhatsAppApprovedTemplates,
  getRFMSegments,
  getWhatsAppMessageIntelligence,
  RFMSegment,
  testSendWhatsAppCampaign,
  TimeFilter,
  WhatsAppApprovedTemplate,
  WhatsAppCampaignTestSendResponse,
  WhatsAppMessageIntelligence,
} from "../../../../services/api";
import { WhatsAppCampaignPerformancePanel } from "./WhatsAppCampaignPerformancePanel";

type CampaignStep = "segment" | "audience" | "message" | "review" | "performance";
type SaveStatus = "saved" | "saving" | "error";

type CampaignDraft = {
  name: string;
  step: CampaignStep;
  segmentName: string;
  includeRecentConsent: boolean;
  cityFocus: string;
  messageType: string;
  offer: string;
  campaignLink: string;
  body: string;
  testPhones: string;
  approvedTemplateName: string;
  approvedTemplateLanguage: string;
  backendCampaignId?: number;
  status: "draft" | "ready" | "sending" | "sent" | "failed";
};

type TestSendResult = {
  phone: string;
  status: "sent" | "failed";
  response?: WhatsAppCampaignTestSendResponse;
  error?: string;
};

interface WhatsAppCampaignsProps {
  timeFilter: string;
}

const STORAGE_KEY = "mastergroup.whatsappCampaignWorkbench.draft";

const steps: Array<{ id: CampaignStep; label: string; helper: string }> = [
  { id: "segment", label: "Segment", helper: "Select audience" },
  { id: "audience", label: "Audience", helper: "Refine reach" },
  { id: "message", label: "Message", helper: "Write copy" },
  { id: "review", label: "Review", helper: "Check draft" },
  { id: "performance", label: "Performance", helper: "Track results" },
];

const defaultDraft: CampaignDraft = {
  name: "May bedding reactivation campaign",
  step: "segment",
  segmentName: "",
  includeRecentConsent: false,
  cityFocus: "",
  messageType: "Promotional offer",
  offer: "Free consultation + limited-time bundle pricing",
  campaignLink: "https://mastergroup.pk/campaign/whatsapp?utm_source=whatsapp&utm_medium=campaign",
  body: "Hi {{customer_name}}, Master Group has a special bedding offer selected for you. Reply YES and our team will help you choose the right product.",
  testPhones: "923214809481, 923030644282",
  approvedTemplateName: "hello_world",
  approvedTemplateLanguage: "en_US",
  status: "draft",
};

const fallbackSegments: RFMSegment[] = [
  {
    segment_name: "Champions",
    customer_count: 1500,
    total_revenue: 0,
    avg_order_value: 0,
    avg_orders_per_customer: 0,
    avg_days_since_last_order: 15,
    percentage: 0,
  },
  {
    segment_name: "At Risk",
    customer_count: 2200,
    total_revenue: 0,
    avg_order_value: 0,
    avg_orders_per_customer: 0,
    avg_days_since_last_order: 90,
    percentage: 0,
  },
  {
    segment_name: "Hibernating",
    customer_count: 3100,
    total_revenue: 0,
    avg_order_value: 0,
    avg_orders_per_customer: 0,
    avg_days_since_last_order: 180,
    percentage: 0,
  },
];

const formatNumber = (value: number): string => value.toLocaleString("en-US");

const parseTestPhones = (value: string): string[] =>
  Array.from(new Set(value.split(/[\s,;]+/).map((phone) => phone.replace(/\D/g, "")).filter(Boolean)));

const buildApprovedTemplateVariables = (
  template: WhatsAppApprovedTemplate | undefined,
  customer: WhatsAppMessageIntelligence["sample_customers"][number] | undefined,
  draft: CampaignDraft
): Record<string, string> => {
  const count = template?.body_parameter_count ?? 0;
  if (!count) return {};

  const values = [
    customer?.customer_name || "there",
    customer?.last_product || "your recent Master purchase",
    customer?.recommended_product_1 || customer?.recommended_products?.[0] || draft.offer || "a Master comfort offer",
    draft.campaignLink,
    draft.offer,
  ];

  return Array.from({ length: count }).reduce<Record<string, string>>((variables, _item, index) => {
    variables[String(index + 1)] = values[index] || values[values.length - 1] || "";
    return variables;
  }, {});
};

const estimateSendableUsers = (segment: RFMSegment | undefined, includeRecentConsent: boolean): number => {
  if (!segment) return 0;
  return Math.round(segment.customer_count * (includeRecentConsent ? 0.84 : 0.72));
};

const loadDraft = (): CampaignDraft => {
  try {
    const storedDraft = localStorage.getItem(STORAGE_KEY);
    return storedDraft ? { ...defaultDraft, ...JSON.parse(storedDraft) } : defaultDraft;
  } catch {
    return defaultDraft;
  }
};

export const WhatsAppCampaigns = ({ timeFilter }: WhatsAppCampaignsProps): JSX.Element => {
  const [draft, setDraft] = useState<CampaignDraft>(() => loadDraft());
  const [segments, setSegments] = useState<RFMSegment[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState<boolean>(true);
  const [segmentNotice, setSegmentNotice] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [messageIntelligence, setMessageIntelligence] = useState<WhatsAppMessageIntelligence | null>(null);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState<boolean>(false);
  const [messageGenerationError, setMessageGenerationError] = useState<string>("");
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testSendResults, setTestSendResults] = useState<TestSendResult[]>([]);
  const [testSendError, setTestSendError] = useState<string>("");
  const [approvedTemplates, setApprovedTemplates] = useState<WhatsAppApprovedTemplate[]>([]);
  const [templateNotice, setTemplateNotice] = useState<string>("");
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState<boolean>(false);
  const [templateSubmissionNotice, setTemplateSubmissionNotice] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const fetchSegments = async () => {
      setIsLoadingSegments(true);
      setSegmentNotice("");

      try {
        const liveSegments = await getRFMSegments(timeFilter as TimeFilter);
        if (!isMounted) return;
        setSegments(liveSegments.length ? liveSegments : fallbackSegments);
      } catch {
        if (!isMounted) return;
        setSegments(fallbackSegments);
        setSegmentNotice("Live reach is unavailable. Showing planning estimates.");
      } finally {
        if (isMounted) {
          setIsLoadingSegments(false);
        }
      }
    };

    fetchSegments();

    return () => {
      isMounted = false;
    };
  }, [timeFilter]);

  useEffect(() => {
    let isMounted = true;

    const fetchTemplates = async () => {
      try {
        const response = await getWhatsAppApprovedTemplates();
        if (!isMounted) return;
        const templates = response.templates || [];
        setApprovedTemplates(templates);
        if (templates.length && !templates.some((template) => template.name === draft.approvedTemplateName && template.language === draft.approvedTemplateLanguage)) {
          const firstTemplate = templates[0];
          updateDraft({ approvedTemplateName: firstTemplate.name, approvedTemplateLanguage: firstTemplate.language });
        }
      } catch (error) {
        if (!isMounted) return;
        setTemplateNotice(error instanceof Error ? error.message : "Approved WhatsApp templates are unavailable.");
      }
    };

    fetchTemplates();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSaveStatus("saving");
    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [draft]);

  const selectedSegment = useMemo(
    () => segments.find((segment) => segment.segment_name === draft.segmentName),
    [draft.segmentName, segments]
  );

  const currentStepIndex = Math.max(steps.findIndex((step) => step.id === draft.step), 0);
  const sendableUsers = estimateSendableUsers(selectedSegment, draft.includeRecentConsent);
  const selectedSegmentSummary = selectedSegment
    ? `${selectedSegment.segment_name} · ${formatNumber(selectedSegment.customer_count)} customers`
    : "No segment selected";
  const reachableSummary = selectedSegment
    ? `${formatNumber(sendableUsers)} sendable of ${formatNumber(selectedSegment.customer_count)} reachable`
    : "Select a segment to calculate reach";
  const selectedApprovedTemplate = approvedTemplates.find(
    (template) => template.name === draft.approvedTemplateName && template.language === draft.approvedTemplateLanguage
  );

  const updateDraft = (changes: Partial<CampaignDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...changes }));
  };

  const goToStep = (step: CampaignStep) => updateDraft({ step });
  const goBack = () => currentStepIndex > 0 && goToStep(steps[currentStepIndex - 1].id);
  const goNext = () => currentStepIndex < steps.length - 1 && goToStep(steps[currentStepIndex + 1].id);

  const saveDraftNow = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const ensureBackendCampaignDraft = async (): Promise<number> => {
    if (draft.backendCampaignId) return draft.backendCampaignId;

    const campaign = await createWhatsAppCampaignDraft({
      name: draft.name,
      message_template: draft.body,
      filters: {
        segment: draft.segmentName,
        time_filter: timeFilter,
        order_source: "all",
        require_consent: draft.includeRecentConsent,
      },
      metadata: {
        city_focus: draft.cityFocus,
        draft_source: "whatsapp_workbench",
      },
    });

    updateDraft({ backendCampaignId: campaign.id });
    return campaign.id;
  };

  const generateSmartMessageDraft = async () => {
    if (!draft.segmentName) {
      setMessageGenerationError("Select an RFM segment before generating customer-wise message intelligence.");
      return;
    }

    setIsGeneratingMessage(true);
    setMessageGenerationError("");

    try {
      const campaignId = await ensureBackendCampaignDraft();
      const intelligence = await getWhatsAppMessageIntelligence(campaignId, {
        limit: 5,
        discountCode: draft.offer,
        campaignLink: draft.campaignLink,
      });
      setMessageIntelligence(intelligence);
      updateDraft({ body: intelligence.template });
    } catch (error) {
      setMessageGenerationError(error instanceof Error ? error.message : "Failed to generate message intelligence.");
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const submitMasterTemplateForApproval = async () => {
    setIsSubmittingTemplate(true);
    setTemplateSubmissionNotice("");
    setTemplateNotice("");

    try {
      const created = await createMasterWhatsAppRecommendationTemplate();
      const response = await getWhatsAppApprovedTemplates();
      const templates = response.templates || [];
      setApprovedTemplates(templates);
      const approvedMatch = templates.find((template) => template.name === created.template.name && template.language === created.template.language);
      updateDraft({
        approvedTemplateName: created.template.name,
        approvedTemplateLanguage: created.template.language,
      });
      setTemplateSubmissionNotice(
        approvedMatch
          ? "Master recommendation template is approved and ready to test."
          : `Master recommendation template submitted to Meta with status ${created.template.status || "PENDING"}.`
      );
    } catch (error) {
      setTemplateSubmissionNotice(error instanceof Error ? error.message : "Failed to submit Master template to Meta.");
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  const sendInternalTestMessages = async () => {
    if (!draft.segmentName) {
      setTestSendError("Select an RFM segment before sending a WhatsApp test.");
      return;
    }

    const phones = parseTestPhones(draft.testPhones);
    if (!phones.length) {
      setTestSendError("Add at least one internal test phone number.");
      return;
    }

    setIsSendingTest(true);
    setTestSendError("");
    setTestSendResults([]);

    try {
      const campaignId = await ensureBackendCampaignDraft();
      const sampleCustomer = messageIntelligence?.sample_customers?.[0];
      const variables = buildApprovedTemplateVariables(selectedApprovedTemplate, sampleCustomer, draft);
      const results: TestSendResult[] = [];

      for (const phone of phones) {
        try {
          const response = await testSendWhatsAppCampaign(campaignId, {
            phone,
            customer_id: sampleCustomer?.customer_id,
            template_name: draft.approvedTemplateName,
            template_language: draft.approvedTemplateLanguage,
            variables,
          });
          results.push({ phone, status: "sent", response });
        } catch (error) {
          results.push({ phone, status: "failed", error: error instanceof Error ? error.message : "Failed to send test message." });
        }
      }

      setTestSendResults(results);
    } catch (error) {
      setTestSendError(error instanceof Error ? error.message : "Failed to prepare WhatsApp test campaign.");
    } finally {
      setIsSendingTest(false);
    }
  };

  const renderStepContent = () => {
    if (draft.step === "segment") {
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          {segments.map((segment) => {
            const isSelected = draft.segmentName === segment.segment_name;
            const sendable = estimateSendableUsers(segment, draft.includeRecentConsent);

            return (
              <button
                key={segment.segment_name}
                type="button"
                onClick={() => updateDraft({ segmentName: segment.segment_name })}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  isSelected ? "border-blue-600 bg-blue-50 shadow-md" : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{segment.segment_name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {segment.avg_days_since_last_order
                        ? `${Math.round(segment.avg_days_since_last_order)} days since last order`
                        : "RFM audience"}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {isSelected ? "Selected" : "Choose"}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Reachable</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">{formatNumber(segment.customer_count)}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Sendable est.</p>
                    <p className="mt-1 text-lg font-bold text-emerald-800">{formatNumber(sendable)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (draft.step === "audience") {
      return (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-semibold text-slate-950">Audience rules</h4>
            <p className="mt-1 text-sm text-slate-500">Keep targeting simple for the MVP. These settings stay with the draft as you move around.</p>
            <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                checked={draft.includeRecentConsent}
                onChange={(event) => updateDraft({ includeRecentConsent: event.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">Include customers with recent consent signals</span>
                <span className="block text-sm text-slate-500">Useful for a cleaner WhatsApp sendability estimate before provider integration.</span>
              </span>
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">City focus placeholder</span>
              <input
                value={draft.cityFocus}
                onChange={(event) => updateDraft({ cityFocus: event.target.value })}
                placeholder="Example: Lahore, Karachi, Islamabad"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-sm text-slate-300">Current audience</p>
            <p className="mt-3 text-3xl font-bold">{sendableUsers ? formatNumber(sendableUsers) : "Not ready"}</p>
            <p className="mt-2 text-sm text-slate-300">
              {selectedSegment ? `Estimated sendable users from ${selectedSegment.segment_name}.` : "Select a segment first to calculate sendable users."}
            </p>
          </div>
        </div>
      );
    }

    if (draft.step === "message") {
      return (
        <WhatsAppMessageBuilderStep
          message={draft.body}
          onMessageChange={(body) => updateDraft({ body })}
          segment={draft.segmentName}
          offerValue={draft.offer}
          onOfferChange={(offer) => updateDraft({ offer })}
          campaignLink={draft.campaignLink}
          onCampaignLinkChange={(campaignLink) => updateDraft({ campaignLink })}
          onApplyTemplate={(body) => updateDraft({ body })}
          onGenerateSmartDraft={generateSmartMessageDraft}
          isGeneratingSmartDraft={isGeneratingMessage}
          generationError={messageGenerationError}
          sampleCustomers={messageIntelligence?.sample_customers}
          strategyUses={messageIntelligence?.message_strategy?.uses}
        />
      );
    }

    if (draft.step === "review") {
      return (
        <div className="grid gap-4 lg:grid-cols-4">
          {[
            ["Campaign", draft.name],
            ["Segment", selectedSegmentSummary],
            ["Sendable users", sendableUsers ? formatNumber(sendableUsers) : "Select segment"],
            ["Status", draft.status],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-lg font-bold capitalize text-slate-950">{value}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 lg:col-span-4">
            <p className="text-sm font-semibold text-blue-950">Review note</p>
            <p className="mt-2 text-sm text-blue-900">
              Full-segment WhatsApp sending stays disabled until template approvals, consent checks, and suppression lists are final. Internal test send uses only the allowlisted numbers below.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 lg:col-span-4">
            <div className="mb-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <label className="block">
                <span className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                  Approved Meta template
                  <button
                    type="button"
                    onClick={submitMasterTemplateForApproval}
                    disabled={isSubmittingTemplate}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmittingTemplate ? "Submitting..." : "Submit Master template"}
                  </button>
                </span>
                <select
                  value={`${draft.approvedTemplateName}::${draft.approvedTemplateLanguage}`}
                  onChange={(event) => {
                    const [approvedTemplateName, approvedTemplateLanguage] = event.target.value.split("::");
                    updateDraft({ approvedTemplateName, approvedTemplateLanguage });
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {approvedTemplates.length ? (
                    <>
                      {!selectedApprovedTemplate && (
                        <option value={`${draft.approvedTemplateName}::${draft.approvedTemplateLanguage}`}>
                          {draft.approvedTemplateName} · {draft.approvedTemplateLanguage} · pending
                        </option>
                      )}
                      {approvedTemplates.map((template) => (
                        <option key={`${template.name}-${template.language}`} value={`${template.name}::${template.language}`}>
                          {template.name} · {template.language} · {template.category}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value={`${draft.approvedTemplateName}::${draft.approvedTemplateLanguage}`}>{draft.approvedTemplateName} · {draft.approvedTemplateLanguage}</option>
                  )}
                </select>
                {templateNotice && <span className="mt-2 block text-xs text-amber-700">{templateNotice}</span>}
                {templateSubmissionNotice && <span className="mt-2 block text-xs font-medium text-blue-700">{templateSubmissionNotice}</span>}
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {selectedApprovedTemplate?.body_parameter_count ? `${selectedApprovedTemplate.body_parameter_count} body variables` : "No body variables"}
                </p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                  {selectedApprovedTemplate?.body_text || "This approved template will be sent by Meta. The smart draft remains the planning/preview layer until a matching Master template is approved."}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="block flex-1">
                <span className="text-sm font-semibold text-slate-900">Internal test numbers</span>
                <input
                  value={draft.testPhones}
                  onChange={(event) => updateDraft({ testPhones: event.target.value })}
                  placeholder="923214809481, 923030644282"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  Comma or space separated. Backend test mode rejects numbers outside the provider allowlist. Test send uses the selected approved Meta template.
                </span>
              </label>
              <button
                type="button"
                onClick={sendInternalTestMessages}
                disabled={isSendingTest || !draft.segmentName}
                className="rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSendingTest ? "Sending test..." : "Send test WhatsApp"}
              </button>
            </div>
            {testSendError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{testSendError}</p>}
            {testSendResults.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {testSendResults.map((result) => (
                  <div key={result.phone} className={`rounded-xl border px-4 py-3 ${result.status === "sent" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold ${result.status === "sent" ? "text-emerald-900" : "text-red-900"}`}>{result.phone}</p>
                        <p className={`mt-1 text-xs ${result.status === "sent" ? "text-emerald-700" : "text-red-700"}`}>
                          {result.status === "sent"
                            ? `${result.response?.provider || "provider"} ${result.response?.mock_mode ? "mock" : "live"} ${result.response?.provider_mode || "mode"}`
                            : result.error}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${result.status === "sent" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                        {result.status === "sent" ? "Accepted" : "Failed"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <WhatsAppCampaignPerformancePanel
        campaign={{
          id: "local-draft",
          name: draft.name,
          segmentName: draft.segmentName || "Audience not selected",
          status: draft.status,
          dateRangeLabel: timeFilter,
          sourceFilters: [draft.cityFocus ? `City: ${draft.cityFocus}` : "All cities", draft.includeRecentConsent ? "Recent consent included" : "Consent filter off"],
          providerMode: draft.status === "sent" ? "mock" : "provisional",
          attributionWindowDays: 7,
          lastUpdatedLabel: saveStatus === "saved" ? "Draft saved locally" : "Draft saving",
        }}
        metrics={{
          audience: selectedSegment?.customer_count ?? 0,
          sendable: sendableUsers,
          sent: draft.status === "sent" ? sendableUsers : 0,
          delivered: 0,
          read: 0,
          clicked: 0,
          orders: 0,
          revenue: 0,
        }}
      />
    );
  };

  return (
    <section className="flex min-h-[720px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">WhatsApp Campaign Workbench</p>
            <input
              value={draft.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
              aria-label="Campaign name"
              className="mt-2 w-full border-0 bg-transparent p-0 text-2xl font-bold text-slate-950 outline-none focus:ring-0"
            />
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{selectedSegmentSummary}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{reachableSummary}</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
                {saveStatus === "saving" ? "Saving draft..." : saveStatus === "error" ? "Draft save error" : "Draft saved"}
              </span>
            </div>
            {segmentNotice && <p className="mt-2 text-sm text-amber-700">{segmentNotice}</p>}
          </div>
          <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs text-slate-300">Draft affordance</p>
            <p className="mt-1 text-sm font-semibold">Local campaign draft</p>
            <p className="mt-1 text-xs text-slate-400">Auto-saves on this browser until backend drafts are connected.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 lg:grid-cols-5">
          {steps.map((step, index) => {
            const isActive = draft.step === step.id;
            const isAvailable = index <= currentStepIndex || Boolean(draft.segmentName);

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => goToStep(step.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white shadow-md"
                    : isAvailable
                      ? "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                      : "border-slate-200 bg-slate-100 text-slate-400"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide">Step {index + 1}</span>
                <span className="mt-1 block text-sm font-bold">{step.label}</span>
                <span className={`mt-1 block text-xs ${isActive ? "text-blue-100" : "text-slate-500"}`}>{step.helper}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-5">
        {isLoadingSegments ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading campaign audiences...</div>
        ) : (
          renderStepContent()
        )}
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Step {currentStepIndex + 1} of {steps.length}: <span className="font-medium text-slate-900">{steps[currentStepIndex].label}</span>
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={goBack} disabled={currentStepIndex === 0}>
            Back
          </Button>
          <Button variant="outline" onClick={saveDraftNow}>
            Save Draft
          </Button>
          <Button onClick={goNext} disabled={currentStepIndex === steps.length - 1} className="bg-foundation-blueblue-900 hover:bg-foundation-blueblue-900">
            Next
          </Button>
        </div>
      </div>
    </section>
  );
};

export const WHATSAPP_MESSAGE_VARIABLES = [
  "{{customer_name}}",
  "{{city}}",
  "{{last_product}}",
  "{{top_category}}",
  "{{recommended_product_1}}",
  "{{recommended_product_2}}",
  "{{discount_code}}",
  "{{campaign_link}}",
] as const;

export type WhatsAppMessageVariable = typeof WHATSAPP_MESSAGE_VARIABLES[number];

export interface WhatsAppMessageSampleCustomer {
  customer_name?: string;
  city?: string;
  last_product?: string;
  top_category?: string;
  recommended_product_1?: string;
  recommended_product_2?: string;
  recommended_product_3?: string;
  recent_products?: string[];
  recency_days?: number;
  total_orders?: number;
  discount_code?: string;
  campaign_link?: string;
}

export interface WhatsAppMessageValidationIssue {
  id: string;
  label: string;
  tone: "warning" | "error" | "success";
}

export interface WhatsAppMessageBuilderStepProps {
  message: string;
  onMessageChange: (message: string) => void;
  segment?: string;
  offerValue?: string;
  onOfferChange?: (offer: string) => void;
  campaignLink?: string;
  onCampaignLinkChange?: (link: string) => void;
  sampleCustomer?: WhatsAppMessageSampleCustomer;
  sampleCustomers?: WhatsAppMessageSampleCustomer[];
  strategyUses?: string[];
  onApplyTemplate?: (template: string) => void;
  onGenerateSmartDraft?: () => void;
  isGeneratingSmartDraft?: boolean;
  generationError?: string;
  disabled?: boolean;
  className?: string;
}

interface WhatsAppTextEditorProps {
  value: string;
  onChange: (message: string) => void;
  onRegisterInsert?: (insert: (token: string) => void) => void;
  disabled?: boolean;
}

const messagePreviewCustomer: Required<WhatsAppMessageSampleCustomer> = {
  customer_name: "Ayesha",
  city: "Lahore",
  last_product: "Ortho mattress",
  top_category: "pillows and protectors",
  recommended_product_1: "Mattress protector",
  recommended_product_2: "Cooling pillow",
  recommended_product_3: "Comfort cushion",
  recent_products: ["Ortho mattress", "Memory pillow"],
  recency_days: 42,
  total_orders: 3,
  discount_code: "MASTER10",
  campaign_link: "https://mastergroup.pk/campaign/whatsapp?utm_source=whatsapp",
};

const messageTemplatesBySegment: Record<string, string> = {
  champions: 'Hi {{customer_name | default: "there"}}, your VIP early access is ready. Upgrade your sleep setup with premium {{top_category}} bundles and use {{discount_code}} before checkout: {{campaign_link}}',
  "loyal customers": 'Hi {{customer_name | default: "there"}}, thank you for choosing Master again. We picked a loyalty offer on {{top_category}} that pairs well with your {{last_product}}: {{campaign_link}}',
  loyal: 'Hi {{customer_name | default: "there"}}, thank you for choosing Master again. We picked a loyalty offer on {{top_category}} that pairs well with your {{last_product}}: {{campaign_link}}',
  "new customers": 'Hi {{customer_name | default: "there"}}, welcome to Master. Complete your new setup with recommended {{top_category}} and unlock {{discount_code}} here: {{campaign_link}}',
  "at risk": 'Hi {{customer_name | default: "there"}}, we saved a limited win-back offer for you in {{city}}. Use {{discount_code}} on {{top_category}} before it ends: {{campaign_link}}',
  hibernating: 'Hi {{customer_name | default: "there"}}, it has been a while since your last Master purchase. Reactivate your comfort upgrade with {{discount_code}} here: {{campaign_link}}',
  lost: 'Hi {{customer_name | default: "there"}}, we would love to welcome you back to Master. Claim a stronger return offer on {{top_category}} with {{discount_code}}: {{campaign_link}}',
};

const placeholderLinkPatterns = ["example.com", "localhost", "test.com", "your-link", "placeholder"];
const internalCopyTerms = ["dummy", "lorem ipsum", "test message", "internal only", "qa only"];

export const getDefaultWhatsAppMessageTemplate = (segment?: string) => (
  segment ? messageTemplatesBySegment[segment.trim().toLowerCase()] || messageTemplatesBySegment.loyal : messageTemplatesBySegment.loyal
);

export const validateWhatsAppMessage = ({
  message,
  offerValue,
  campaignLink,
}: {
  message: string;
  offerValue?: string;
  campaignLink?: string;
}): WhatsAppMessageValidationIssue[] => {
  const text = message.trim();
  const link = campaignLink?.trim() || "";
  const lowerText = text.toLowerCase();
  const issues: WhatsAppMessageValidationIssue[] = [];

  if (!text) issues.push({ id: "empty-message", label: "Message text is required before review.", tone: "error" });
  if (text.includes("{{campaign_link}}") && !link) issues.push({ id: "missing-link", label: "Add the tracked campaign link used by {{campaign_link}}.", tone: "error" });
  if (link && !isValidTrackedCampaignUrl(link)) issues.push({ id: "invalid-link", label: "Campaign link should be a valid http(s) URL with UTM, campaign, or cid tracking.", tone: "warning" });
  if (text.includes("{{discount_code}}") && !offerValue?.trim()) issues.push({ id: "missing-offer", label: "Add a discount code or offer text for {{discount_code}}.", tone: "warning" });
  if (/{{\s*(customer_name|city|last_product|top_category)\s*}}/.test(text)) issues.push({ id: "fallbacks", label: 'Consider fallbacks for variables that may be blank, such as {{customer_name | default: "there"}}.', tone: "warning" });
  if (placeholderLinkPatterns.some((pattern) => lowerText.includes(pattern))) issues.push({ id: "placeholder-link", label: "Replace placeholder URLs before sending.", tone: "warning" });
  if (internalCopyTerms.some((term) => lowerText.includes(term))) issues.push({ id: "internal-copy", label: "Remove test or internal-only wording from campaign copy.", tone: "error" });
  if (text && issues.length === 0) issues.push({ id: "ready", label: "Message looks ready for review and send.", tone: "success" });

  return issues;
};

export const WhatsAppTextEditor = ({ value, onChange, onRegisterInsert, disabled = false }: WhatsAppTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageParts = Math.max(1, Math.ceil(value.length / 1024));

  const insertToken = (token: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const prefix = value.slice(0, start);
    const suffix = value.slice(end);
    const spacer = prefix && !prefix.endsWith(" ") && token.startsWith("{{") ? " " : "";
    const nextMessage = `${prefix}${spacer}${token}${suffix}`;

    onChange(nextMessage);
    window.requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + spacer.length + token.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  };

  onRegisterInsert?.(insertToken);

  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
        WhatsApp copy
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          {value.length.toLocaleString()} chars · ~{messageParts} part{messageParts === 1 ? "" : "s"}
        </span>
      </span>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={9}
        placeholder="Write a targeted WhatsApp message. Use variables for personalization and keep the CTA clear."
        className="mt-2 min-h-56 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </label>
  );
};

export const VariableInsertionButtons = ({
  onInsertVariable,
  disabled = false,
}: {
  onInsertVariable: (variableName: WhatsAppMessageVariable) => void;
  disabled?: boolean;
}) => (
  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
    <p className="mb-3 text-sm font-semibold text-emerald-900">Personalization variables</p>
    <div className="flex flex-wrap gap-2">
      {WHATSAPP_MESSAGE_VARIABLES.map((variable) => (
        <button key={variable} type="button" onClick={() => onInsertVariable(variable)} disabled={disabled} className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">
          + {variable}
        </button>
      ))}
    </div>
  </div>
);

export const OfferInput = ({ value = "", onChange, disabled = false }: { value?: string; onChange?: (offer: string) => void; disabled?: boolean }) => (
  <label className="block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <span className="text-sm font-semibold text-slate-800">Discount / offer placeholder</span>
    <input value={value} onChange={(event) => onChange?.(event.target.value)} disabled={disabled || !onChange} placeholder="MASTER10, Free protector, VIP bundle offer..." className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60" />
    <span className="mt-2 block text-xs text-slate-500">Used in preview for {"{{discount_code}}"} until provider templates are wired.</span>
  </label>
);

export const TrackedLinkInput = ({ value = "", onChange, disabled = false }: { value?: string; onChange?: (link: string) => void; disabled?: boolean }) => (
  <label className="block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <span className="text-sm font-semibold text-slate-800">Tracked campaign link</span>
    <input value={value} onChange={(event) => onChange?.(event.target.value)} disabled={disabled || !onChange} placeholder="https://mastergroup.pk/campaign/summer?utm_source=whatsapp" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60" />
    <span className="mt-2 block text-xs text-slate-500">Include tracking parameters so ROI attribution can connect clicks to sends.</span>
  </label>
);

export const ValidationWarnings = ({ issues }: { issues: WhatsAppMessageValidationIssue[] }) => (
  <div className="space-y-2">
    <p className="text-sm font-semibold text-slate-800">Validation checks</p>
    {issues.map((issue) => (
      <div key={issue.id} className={`rounded-xl border px-3 py-2 text-sm ${issue.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : issue.tone === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
        {issue.tone === "success" ? "Ready: " : "Check: "}{issue.label}
      </div>
    ))}
  </div>
);

export const WhatsAppLivePreview = ({
  message,
  offerValue,
  campaignLink,
  sampleCustomer: sampleOverrides,
  segment,
}: {
  message: string;
  offerValue?: string;
  campaignLink?: string;
  sampleCustomer?: WhatsAppMessageSampleCustomer;
  segment?: string;
}) => {
  const previewCustomer = { ...messagePreviewCustomer, ...sampleOverrides };
  const previewMessage = renderSampleWhatsAppMessage({ message: message || getDefaultWhatsAppMessageTemplate(segment), offerValue, campaignLink, sampleCustomer: previewCustomer });
  const linkForPreview = campaignLink?.trim() || previewCustomer.campaign_link;

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-3 shadow-xl">
      <div className="overflow-hidden rounded-[1.5rem] bg-[#e9f5e7]">
        <div className="flex items-center justify-between bg-emerald-700 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-sm font-bold">M</div>
            <div><p className="text-sm font-bold">Master Group</p><p className="text-xs text-emerald-100">WhatsApp Business preview</p></div>
          </div>
          <span className="text-xs text-emerald-100">Live</span>
        </div>
        <div className="space-y-3 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.7),transparent_28%),linear-gradient(135deg,#e6f4e8,#d8efe0)] px-4 py-5">
          <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-white px-3 py-2 text-sm leading-6 text-slate-900 shadow-sm">
            <p className="whitespace-pre-wrap">{previewMessage}</p>
            <div className="mt-2 text-right text-[10px] font-medium text-slate-400">11:42 AM ✓✓</div>
          </div>
          {linkForPreview && (
            <div className="ml-auto max-w-[88%] overflow-hidden rounded-2xl rounded-tr-sm border border-emerald-100 bg-white shadow-sm">
              <div className="h-20 bg-gradient-to-br from-emerald-100 via-sky-50 to-white" />
              <div className="space-y-1 px-3 py-2"><p className="text-xs font-bold text-slate-800">Master campaign link</p><p className="truncate text-xs text-slate-500">{linkForPreview}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const WhatsAppMessageBuilderStep = ({
  message,
  onMessageChange,
  segment,
  offerValue,
  onOfferChange,
  campaignLink,
  onCampaignLinkChange,
  sampleCustomer: sampleOverrides,
  sampleCustomers,
  strategyUses,
  onApplyTemplate,
  onGenerateSmartDraft,
  isGeneratingSmartDraft = false,
  generationError = "",
  disabled = false,
  className = "",
}: WhatsAppMessageBuilderStepProps) => {
  const insertRef = useRef<(token: string) => void>();
  const template = useMemo(() => getDefaultWhatsAppMessageTemplate(segment), [segment]);
  const issues = useMemo(() => validateWhatsAppMessage({ message, offerValue, campaignLink }), [campaignLink, message, offerValue]);
  const previewCustomer = sampleCustomers?.[0] || sampleOverrides;

  return (
    <section className={`space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5 ${className}`}>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">WhatsApp message builder</p><h3 className="mt-2 text-xl font-bold text-slate-950">Generate customer-aware copy</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Use the selected RFM segment, recent purchases, and recommended products to draft one smart placeholder template.</p></div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={onGenerateSmartDraft} disabled={disabled || !onGenerateSmartDraft || isGeneratingSmartDraft} className="rounded-xl border border-blue-200 bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isGeneratingSmartDraft ? "Generating..." : "Generate smart draft"}</button>
                <button type="button" onClick={() => onApplyTemplate?.(template)} disabled={disabled || !onApplyTemplate} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">Use {segment ? `${segment} ` : ""}template</button>
              </div>
            </div>
            {generationError && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{generationError}</p>}
            {strategyUses?.length ? (
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {strategyUses.map((strategy) => (
                  <div key={strategy} className="rounded-xl border border-blue-100 bg-white/80 px-3 py-2 text-xs font-medium text-blue-900">{strategy}</div>
                ))}
              </div>
            ) : null}
          </div>
          <WhatsAppTextEditor value={message} onChange={onMessageChange} onRegisterInsert={(insert) => { insertRef.current = insert; }} disabled={disabled} />
          <VariableInsertionButtons onInsertVariable={(variable) => insertRef.current?.(variable)} disabled={disabled} />
          <div className="grid gap-3 md:grid-cols-2">
            <OfferInput value={offerValue} onChange={onOfferChange} disabled={disabled} />
            <TrackedLinkInput value={campaignLink} onChange={onCampaignLinkChange} disabled={disabled} />
          </div>
        </div>
        <div className="space-y-4">
          <WhatsAppLivePreview message={message} offerValue={offerValue} campaignLink={campaignLink} sampleCustomer={previewCustomer} segment={segment} />
          {sampleCustomers?.length ? <CustomerIntelligenceSamples customers={sampleCustomers} /> : null}
          <ValidationWarnings issues={issues} />
        </div>
      </div>
    </section>
  );
};

const CustomerIntelligenceSamples = ({ customers }: { customers: WhatsAppMessageSampleCustomer[] }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <p className="text-sm font-semibold text-slate-800">Sample customer intelligence</p>
    <div className="mt-3 space-y-2">
      {customers.slice(0, 5).map((customer, index) => (
        <div key={`${customer.customer_name || "customer"}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{customer.customer_name || "Customer"}</p>
              <p className="mt-1 text-xs text-slate-500">
                Recent: {customer.last_product || "recent purchase"} · Rec: {customer.recommended_product_1 || "next best product"}
              </p>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-600">{customer.city || "City"}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const isValidTrackedCampaignUrl = (value: string) => {
  try {
    const url = new URL(value);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const hasTracking = url.searchParams.has("utm_source") || url.searchParams.has("campaign") || url.searchParams.has("cid");
    const isPlaceholder = placeholderLinkPatterns.some((pattern) => value.toLowerCase().includes(pattern));

    return isHttp && hasTracking && !isPlaceholder;
  } catch {
    return false;
  }
};

const renderSampleWhatsAppMessage = ({
  message,
  offerValue,
  campaignLink,
  sampleCustomer: customer,
}: {
  message: string;
  offerValue?: string;
  campaignLink?: string;
  sampleCustomer: Required<WhatsAppMessageSampleCustomer>;
}) => {
  const replacements: Record<string, string> = {
    customer_name: customer.customer_name,
    city: customer.city,
    last_product: customer.last_product,
    top_category: customer.top_category,
    recommended_product_1: customer.recommended_product_1,
    recommended_product_2: customer.recommended_product_2,
    recommended_product_3: customer.recommended_product_3,
    discount_code: offerValue?.trim() || customer.discount_code,
    campaign_link: campaignLink?.trim() || customer.campaign_link,
  };

  return message.replace(/{{\s*(\w+)(?:\s*\|\s*default:\s*"([^"]+)")?\s*}}/g, (_match, key: string, fallback?: string) => replacements[key] || fallback || `[${key}]`);
};
