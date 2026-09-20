// i18n index — merges all Arabic string modules.
// Owned by main agent. Each module is filled by its assigned agent.
import { common } from './common'
import { landing } from './landing'
import { auth } from './auth'
import { onboarding } from './onboarding'
import { dashboard } from './dashboard'
import { templates } from './templates'
import { help } from './help'
import { settings } from './settings'
import { components } from './components'
import { newProject } from './new-project'
import { builder } from './builder'
import { exportStrings } from './export'

export const t = {
  common,
  landing,
  auth,
  onboarding,
  dashboard,
  templates,
  help,
  settings,
  components,
  newProject,
  builder,
  export: exportStrings,
}

export type Translations = typeof t
