const initialState = {
  locale: 'en',
  users: {
    loading: false, // loading users list
    saving: false, // adding/updating a user
    list: [], // full users list
  },
  resources: {
    fetched: false, // did we already request server data (note: fetched is true as soon as data is requested)?
    loading: false, // loading resources list
    list: [], // full resources list
  },
  topics: {
    loading: false,
    list: [],
  },
  // current user (session)
  user: {
    id: null,
    name: null,
    email: null,
    role: 'anonymous', // should be 'anonymous', 'visitor' or 'admin'
    checkedServerLogin: false, // true once we asked to server if user was already logged in
    verifying: false, // true when sending google oauth code to API server for verification
  },
}

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOCALE':
      return { ...state, locale: action.payload }

    // users
    case 'SAVE_USER_REQUEST':
      return { ...state, users: { ...state.users, saving: true } }

    case 'GET_USERS_REQUEST':
    case 'GET_USER_REQUEST':
      return { ...state, users: { ...state.users, loading: true, list: [] } }

    case 'GET_USERS_SUCCESS':
      return {
        ...state,
        users: { ...state.users, loading: false, list: action.payload },
      }

    case 'GET_USER_SUCCESS':
      return {
        ...state,
        users: {
          saving: false,
          loading: false,
          list: state.users.list // TODO we may need to be smarter about this flag // TODO we may need to be smarter about this flag
            .filter(u => u.id !== action.payload.id)
            .concat(action.payload),
        },
        user:
          state.user.id === action.payload.id
            ? { ...state.user, ...action.payload }
            : state.user,
      }

    // resources

    case 'FETCH_RESOURCES':
    case 'FETCH_RESOURCE':
      return { ...state, resources: { fetched: true, loading: true, list: [] } }

    case 'RECEIVE_RESOURCES':
      return {
        ...state,
        resources: {
          fetched: true,
          loading: false,
          list: action.payload.resources,
        },
      }

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

    // topics

    case 'GET_TOPICS_SUCCESS':
      return {
        ...state,
        topics: { ...state.topics, loading: false, list: action.payload },
      }

    // session

    case 'CHECKED_USER_SESSION':
      return {
        ...state,
        user: { ...state.user, checkedServerLogin: action.payload },
      }

    case 'VERIFYING_USER':
      return { ...state, user: { ...state.user, verifying: action.payload } }

    case 'LOGIN':
      return {
        ...state,
        user: { ...state.user, ...action.payload, verifying: false },
      }

    case 'LOGOUT':
      return {
        ...state,
        user: { ...state.user, id: null, name: null, email: null, role: null },
      }
    default:
      return state
  }
}
