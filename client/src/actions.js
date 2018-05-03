//TODO flow but thunk actions mess with typing :(

// under a namespace to avoid collision with action creators
// example api.deleteUser vs action creator deleteUser
import * as api from './api'

// stripped version (without reducer) of
// https://medium.com/skyshidigital/simplify-redux-request-success-failure-pattern-ce77340eae06
function helper(actionName, fn) {
  if (typeof actionName !== 'string') {
    throw new Error('actionName must be a string')
  }
  if (typeof fn !== 'function') {
    throw new Error('fn must be a function')
  }
  const actionNameUpper = actionName.toUpperCase()
  const actionRequest = actionNameUpper + '_REQUEST'
  const actionSuccess = actionNameUpper + '_SUCCESS'
  const actionFailure = actionNameUpper + '_FAILURE'

  const action = function(...args: any[]) {
    return (dispatch: Function) => {
      dispatch({ type: actionRequest })
      try {
        const result = fn(...args)
        if (typeof result.then === 'function') {
          return result
            .then(data =>
              dispatch({
                type: actionSuccess,
                payload: data,
              }),
            )
            .catch(error =>
              dispatch({
                type: actionFailure,
                // to see them in redux devtools
                error: { message: error.message, stack: error.stack },
              }),
            )
        } else {
          dispatch({
            type: actionSuccess,
            payload: result,
          })
        }
      } catch (error) {
        dispatch({
          type: actionFailure,
          error,
        })
      }
    }
  }

  return {
    action,
    actionTypes: {
      request: actionRequest,
      success: actionSuccess,
      failure: actionFailure,
    },
  }
}

export const setLocale = (payload: Locale) => ({ type: 'SET_LOCALE', payload })

// users
export const getUser = helper('GET_USER', api.getUser).action
export const getUsers = helper('GET_USERS', api.getUsers).action
export const deleteUser = helper('DELETE_USER', api.deleteUser).action

export const saveUser = ({ id, ...data }) => (dispatch: Function) => {
  dispatch({ type: 'SAVE_USER_REQUEST' })

  const save = () => (id ? api.updateUser(id, data) : api.addUser(data))
  return save()
    .then(user =>
      dispatch({
        type: 'GET_USER_SUCCESS',
        payload: user,
      }),
    )
    .catch(error => {
      dispatch({
        type: 'SAVE_USER_FAILURE',
        error,
      })
      throw error
    })
}

// resources

export const fetchResources = () => dispatch => {
  dispatch({ type: 'FETCH_RESOURCES' })

  api.getResources().then(resources =>
    dispatch({
      type: 'RECEIVE_RESOURCES',
      payload: { resources },
    }),
  ) // TODO handle error
}

// Manual add/replace of a resource
export const replaceResource = resource => ({
  type: 'RECEIVE_RESOURCE',
  payload: { resource },
})

// topics

export const getTopic = helper('GET_TOPIC', api.getTopic).action
export const getTopics = helper('GET_TOPICS', api.getTopics).action
export const deleteTopic = helper('DELETE_TOPIC', api.deleteTopic).action

export const saveTopic = (data, id: string) => (dispatch: Function) => {
  dispatch({ type: 'SAVE_TOPIC_REQUEST' })

  // beware, id can be 0
  const save = () => (id != null ? api.updateTopic(id, data) : api.addTopic(data))
  return save()
    .then(topic =>
      dispatch({
        type: 'GET_TOPIC_SUCCESS',
        payload: topic,
      }),
    )
    .catch(error => {
      dispatch({
        type: 'SAVE_TOPIC_FAILURE',
        error,
      })
      throw error
    })
}

// session

export const userLogin = ({ id, name, email, role = 'visitor' }) => ({
  type: 'LOGIN',
  payload: { id, name, email, role },
})

export const userLogout = () => ({
  type: 'LOGOUT',
})

export const notifyCheckedUserSession = (isChecked = true) => ({
  type: 'CHECKED_USER_SESSION',
  payload: isChecked,
})

export const notifyVerifyingUser = (isVerifying = true) => ({
  type: 'VERIFYING_USER',
  payload: isVerifying,
})
