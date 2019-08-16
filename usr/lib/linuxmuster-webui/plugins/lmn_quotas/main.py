from jadi import component
from aj.plugins.core.api.sidebar import SidebarItemProvider
from aj.auth import PermissionProvider


@component(SidebarItemProvider)
class ItemProvider(SidebarItemProvider):
    def __init__(self, context):
        self.context = context

    def provide(self):
        return [
            {
                'attach': 'category:schoolsettingsdefaults',
                'name': _('Quotas'),
                'icon': 'chart-pie',
                'url': '/view/lm/quotas',
                'children': [],
                'weight': 30,
            },
        ]


@component(PermissionProvider)
class Permissions (PermissionProvider):
    def provide(self):
        return [
            {
                'id': 'lm:quotas:ldap-search',
                'name': _('Read LDAP'),
                'default': False,
            },
            {
                'id': 'lm:quotas:configure',
                'name': _('Configure quotas'),
                'default': False,
            },
            {
                'id': 'lm:quotas:apply',
                'name': _('Set quotas'),
                'default': False,
            },
        ]
