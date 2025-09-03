export const useAuthUser = () => {
  const { user, isAuthenticated } = useAuth()
  
  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`.trim()
  })
  
  const initials = computed(() => {
    if (!user.value) return ''
    const first = user.value.firstName?.charAt(0) || ''
    const last = user.value.lastName?.charAt(0) || ''
    return `${first}${last}`.toUpperCase()
  })
  
  const displayName = computed(() => {
    if (!user.value) return ''
    return user.value.name || fullName.value || user.value.username
  })
  
  const isAdmin = computed(() => {
    if (!user.value) return false
    return user.value.groups.some(group => 
      ['administrators', 'domain admins', 'admin'].some(adminGroup =>
        group.toLowerCase().includes(adminGroup)
      )
    )
  })
  
  const department = computed(() => user.value?.department || '')
  const title = computed(() => user.value?.title || '')
  const email = computed(() => user.value?.email || '')
  const phone = computed(() => user.value?.phone || '')
  
  const groups = computed(() => user.value?.groups || [])
  
  return {
    user,
    isAuthenticated,
    fullName,
    initials,
    displayName,
    isAdmin,
    department,
    title,
    email,
    phone,
    groups
  }
}
