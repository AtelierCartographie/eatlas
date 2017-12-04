const initialState = {
  users: {
    loading: true,
    list: [],
  },
  login: null, // contains google oauth response
  admin: false, // user's role (once logged in)
  ui: { // progress bars, loaders 'n co
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

    case 'ui':
      return { ...state, ui: { ...state.ui, ...action.payload } }
    case 'login':
      return { ...state, login: action.payload, admin: true } // FIXME user's role
    case 'logout':
      return { ...state, login: null, admin: false }
    default:
      return state
  }
}
