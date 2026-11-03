# Component render and loading-state test inventory

Scope: all 48 JSX modules under `src/components/`, including exported dashboard subcomponents through their containing module. Root App integration is separately covered by `AppCoverage.test.jsx`, `TutorFeedbackApp.test.jsx`, and `RecommendationFeedbackApp.test.jsx`.

This is a source/test audit, not a claim of visual browser coverage. Test names below point to assertions on rendered behavior. Loading tests are required where the component actually has a pending prop/request state. Synchronous presentational components are marked N/A instead of adding fake loading props. Some tests render child components through a real parent integration.

| Component | Render evidence | Loading/pending evidence |
|---|---|---|
| ActivityHeatmap.jsx | ActivityHeatmapAndRadar.test.jsx; EdgeCasesFrontend.test.jsx | N/A — synchronous props/interaction only; no loading state |
| AdminView.jsx | LoadingStatesCoverage.test.jsx; AdminView.test.jsx | AdminView.test.jsx; LoadingStatesCoverage.test.jsx (question/feedback list status, pending writes) |
| AnalyticsFullView.jsx | PageTitlesAndTagging.test.jsx; SprintOneViews.test.jsx; LoadingStatesCoverage.test.jsx | LoadingStatesCoverage.test.jsx (pending auxiliary requests); no visible loading indicator exists |
| AnalyticsPanel.jsx | RequiredDashboardCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| AuthModal.jsx | AuthModalCoverage.test.jsx | AuthModalCoverage.test.jsx (Authenticating disabled) |
| CompetencyRadarChart.jsx | ActivityHeatmapAndRadar.test.jsx; EdgeCasesFrontend.test.jsx | N/A — synchronous props/interaction only; no loading state |
| ContinueLearningRow.jsx | RequiredDashboardCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| DataExport.jsx | DataExport.test.jsx | DataExport.test.jsx (pending export/duplicate clicks) |
| ErrorBoundary.jsx | ErrorBoundary.test.jsx; RouteErrorBoundary.test.jsx | N/A — synchronous props/interaction only; no loading state |
| HeroBanner.jsx | HeroBanner.test.jsx | N/A — synchronous props/interaction only; no loading state |
| KnowledgeGraphView.jsx | KnowledgeGraphView.test.jsx; KnowledgeGraphCoverage.test.jsx; EdgeCasesFrontend.test.jsx | KnowledgeGraphView.test.jsx (initial fetch placeholder) |
| LearnView.jsx | LearnView.test.jsx | LearnView.test.jsx (pending subject list and selected roadmap) |
| LoginScreen.jsx | PageTitlesAndTagging.test.jsx; SprintOneViews.test.jsx | SprintOneViews.test.jsx (Authenticating disabled) |
| MasteryTimeline.jsx | MasteryTimeline.test.jsx | MasteryTimeline.test.jsx (loading status) |
| PasswordRecovery.jsx | PasswordRecovery.test.jsx | PasswordRecovery.test.jsx (Please wait disabled) |
| PracticeView.jsx | AccessibilityCoreFlows.test.jsx; PageTitlesAndTagging.test.jsx; SprintOneViews.test.jsx | LoadingStatesCoverage.test.jsx (quiz controls/exam generation pending) |
| RecommendationFeedback.jsx | RecommendationFeedback.test.jsx | RecommendationFeedback.test.jsx (pending and duplicate-rating controls) |
| RecommendedPanel.jsx | RequiredDashboardCoverage.test.jsx; RecommendationFeedbackIntegration.test.jsx | N/A — synchronous props/interaction only; no loading state |
| ResourcesFullView.jsx | PageTitlesAndTagging.test.jsx; SprintOneViews.test.jsx; RecommendationFeedbackIntegration.test.jsx | N/A — synchronous props/interaction only; no loading state |
| RetentionScheduleCard.jsx | EdgeCasesFrontend.test.jsx; RetentionScheduleCard.test.jsx | RetentionScheduleCard.test.jsx (initial loading placeholder) |
| SettingsView.jsx | ShellCoverage.test.jsx; PageTitlesAndTagging.test.jsx; DeleteAccountSection.test.jsx | DeleteAccountSection.test.jsx (deletion pending through settings integration) |
| Sidebar.jsx | Sidebar.test.jsx; AdminView.test.jsx | N/A — synchronous props/interaction only; no loading state |
| StatCards.jsx | StatCards.test.jsx; RequiredDashboardCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| StudyPlanPanel.jsx | StudyPlanWidgets.test.jsx | N/A — synchronous props/interaction only; no loading state |
| StudyPlanView.jsx | AccessibilityCoreFlows.test.jsx; SprintOneViews.test.jsx | SprintOneViews.test.jsx (generation disabled) |
| TopHeader.jsx | ShellCoverage.test.jsx; PageTitlesAndTagging.test.jsx | N/A — synchronous props/interaction only; no loading state |
| TutorFeedback.jsx | TutorFeedback.test.jsx | TutorFeedback.test.jsx (pending and duplicate-rating controls) |
| TutorPanel.jsx | TutorConversationsView.test.jsx; TutorPanel.test.jsx | TutorConversationsView.test.jsx (list/messages loading and blocked composer) |
| common/BlueprintWizard.jsx | BlueprintWizard.test.jsx | N/A — synchronous props/interaction only; no loading state |
| common/DeleteAccountSection.jsx | DeleteAccountSection.test.jsx (via SettingsView integration) | DeleteAccountSection.test.jsx (pending controls/status through SettingsView) |
| common/EmptyState.jsx | RequiredDashboardCoverage.test.jsx (real AnalyticsPanel/ContinueLearningRow child) | N/A — synchronous props/interaction only; no loading state |
| common/FlashFixCard.jsx | FlashFixCard.test.jsx | N/A — synchronous props/interaction only; no loading state |
| common/GlobalSearch.jsx | GlobalSearch.test.jsx | N/A — synchronous props/interaction only; no loading state |
| common/MilestoneProgressTree.jsx | StudyPlanWidgets.test.jsx | N/A — synchronous props/interaction only; no loading state |
| common/NotificationDropdown.jsx | NotificationDropdown.test.jsx | N/A — synchronous props/interaction only; no loading state |
| common/ResourceCard.jsx | ResourceCard.test.jsx | N/A — synchronous props/interaction only; no loading state |
| common/SectionHeader.jsx | LoadingStatesCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| common/SettingSection.jsx | LoadingStatesCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| common/StatCard.jsx | LoadingStatesCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| common/ToggleSwitch.jsx | LoadingStatesCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| layout/AppShell.jsx | ShellCoverage.test.jsx; LayoutResponsiveCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| layout/CardGrid.jsx | CardGrid.test.jsx | N/A — synchronous props/interaction only; no loading state |
| layout/EmptyState.jsx | EmptyStateLayout.test.jsx | N/A — synchronous props/interaction only; no loading state |
| layout/FilterSidebar.jsx | AccessibilityCoreFlows.test.jsx | N/A — synchronous props/interaction only; no loading state |
| layout/PageContainer.jsx | LayoutResponsiveCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| layout/PageHeader.jsx | PageHeader.test.jsx | N/A — synchronous props/interaction only; no loading state |
| layout/StickyRail.jsx | LayoutResponsiveCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |
| layout/TwoPaneLayout.jsx | LayoutResponsiveCoverage.test.jsx | N/A — synchronous props/interaction only; no loading state |

| AiUsage.jsx | AiUsage.test.jsx; AiQuotaApp.test.jsx | N/A — synchronous prepared presentation; explicit unavailable state tested, no live quota request |

## Limitations

- AnalyticsFullView initiates auxiliary requests and maintains an internal loading flag, but does not render an explicit loading indicator. The test asserts it safely renders while requests remain pending; this is not equivalent to a visible loading-state UX.
- SettingsView fetches profile/Gemini status without an explicit page-loading indicator; pending account deletion is covered through integration.
- PracticeView quiz loading currently uses a spinner overlay without an accessible loading announcement. The test asserts disabled submission and ignored option selection. Accessibility remediation belongs to the audit task.
- Component render/loading inventory is not full behavior coverage or a guarantee of the aggregate branch target. Run the inclusive coverage command for current measured totals.
