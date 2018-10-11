//@flow
import userLang from './user-lang'

const initialState: AppState = {
  // FIXME call it 'lang' instead?
  locale: userLang(),
  users: {
    loading: false, // loading users list
    saving: false, // adding/updating a user
    list: [], // full users list
  },
  resources: {
    // TODO fetched = false should be replaced by list = null
    fetched: false, // did we already request server data (note: fetched is true as soon as data is requested)?
    loading: false, // loading resources list
    list: [], // full resources list
  },
  topics: {
    loading: false,
    saving: false,
    list: [],
  },
  // current user (session)
  user: {
    current: null,
    checkedServerLogin: false, // true once we asked to server if user was already logged in
    verifying: false, // true when sending google oauth code to API server for verification
  },
}

export default (state: AppState = initialState, action: any): AppState => {
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
          list: state.users.list // TODO we may need to be smarter about this flag
            .filter(u => u.id !== action.payload.id)
            .concat(action.payload),
        },
        user:
          (state.user.current || {}).id === action.payload.id
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
          fetched: true,
          list: state.resources.list
            .filter(r => r.id !== action.payload.resource.id)
            .concat(action.payload.resource),
        },
      }

    // topics

    case 'GET_TOPICS_REQUEST':
      return { ...state, topics: { ...state.topics, loading: true, list: [] } }

    case 'GET_TOPICS_SUCCESS':
      return {
        ...state,
        topics: { ...state.topics, loading: false, list: action.payload },
      }

    case 'GET_TOPIC_SUCCESS':
      return {
        ...state,
        topics: {
          ...state.topics,
          saving: false,
          loading: false,
          list: state.topics.list
            .filter(t => t.id !== action.payload.id)
            .concat(action.payload),
        },
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
        user: { ...state.user, current: action.payload, verifying: false },
      }

    case 'LOGOUT':
      return {
        ...state,
        user: { ...state.user, current: null },
      }

    default:
      return state
  }
}
