import { call, put, takeEvery, takeLatest } from "redux-saga/effects";
import authApi from "./authApi";
import {
  loginSuccess,
  loginFailure,
  logoutSuccess,
} from "./authSlice";

export function* watchAuthSaga() {
  yield takeEvery("auth/loginUser", loginSaga);
  yield takeLatest("auth/logoutUser", logoutSaga);
}

function* loginSaga(action) {
  try {
    const { email, password } = action.payload;

    const response = yield call(authApi.login, email, password);

    if (response.token && response.role) {
      yield put(
        loginSuccess({
          token: response.token,
          role: response.role,
          user: response.user || { email },
        })
      );
    } else {
      yield put(loginFailure(response.message || "Login failed"));
    }
  } catch (error) {
    const errorMessage =
      typeof error === "string"
        ? error
        : error?.message || "An error occurred during login";
    yield put(loginFailure(errorMessage));
  }
}

// Logout saga
function* logoutSaga(action) {
  try {
    yield call(authApi.logout);
    yield put(logoutSuccess());
  } catch (error) {
    yield put(logoutSuccess());
  }
}
