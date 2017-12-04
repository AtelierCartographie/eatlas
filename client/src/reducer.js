const initialState = {
  users: {
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

    case 'CHECKED_USER_SESSION':
      return { ...state, user: { ...state.user, checkedServerLogin: action.payload } }
    case 'VERIFYING_USER':
      return { ...state, user: { ...state.user, verifying: action.payload } }
    case 'LOGIN':
      return { ...state, user: { ...state.user, ...action.payload, verifying: false } }
    case 'LOGOUT':
      return { ...state, user: { ...state.user, login: null, role: null } }
    default:
      return state
  }
}
