const initialState = {
  users: {
    loading: true,
    list: [],
  },
  resources: {
    loading: true,
    list: [],
  },
  user: { // current user (session)
    name: null,
    email: null,
    role: 'anonymous', // should be 'anonymous', 'visitor' or 'admin'
    checkedServerLogin: false, // true once we asked to server if user was already logged in
    verifying: false, // true when sending google oauth code to API server for verification
  },
}

export default (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_USERS':
    case 'FETCH_USER':
      return { ...state, users: { loading: true, list: [] } }

    case 'RECEIVE_USERS':
      return { ...state, users: { loading: false, list: action.payload.users } }

    case 'RECEIVE_USER':
      return {
        ...state,
        users: {
          loading: false,
          list: state.users.list
            .filter(u => u.id !== action.payload.user.id)
            .concat(action.payload.user),
        },
      }

    case 'FETCH_RESOURCES':
    case 'FETCH_RESOURCE':
      return { ...state, resources: { loading: true, list: [] } }

    case 'RECEIVE_RESOURCES':
      return { ...state, resources: { loading: false, list: action.payload.resources } }

    case 'RECEIVE_RESOURCE':
      return {
        ...state,
        resources: {
          loading: false,
          list: state.resources.list
            .filter(r => r.id !== action.payload.resource.id)
            .concat(action.payload.resource),
        },
      }

    case 'CHECKED_USER_SESSION':
      return { ...state, user: { ...state.user, checkedServerLogin: action.payload } }
    case 'VERIFYING_USER':
      return { ...state, user: { ...state.user, verifying: action.payload } }
    case 'LOGIN':
      return { ...state, user: { ...state.user, ...action.payload, verifying: false } }
    case 'LOGOUT':
      return { ...state, user: { ...state.user, name: null, email: null, role: null } }
    default:
      return state
  }
}
