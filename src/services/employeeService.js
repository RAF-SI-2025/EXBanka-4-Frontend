/**
 * Employee Service
 *
 * Wraps all employee-related API calls against the API Gateway.
 * All requests require a valid Bearer token (attached by apiClient interceptor).
 */

import { apiClient } from './apiClient'
import { dozvoleFromPermissions } from '../models/Employee'

export const employeeService = {
  /**
   * GET /employees?page=&page_size=
   * Returns { employees: [...], total_count: N }
   */
  async getEmployees({ page = 1, pageSize = 20 } = {}) {
    const { data } = await apiClient.get('/employees', {
      params: { page, page_size: pageSize },
    })
    return data   // { employees, total_count }
  },

  /**
   * GET /employees/:id
   */
  async getEmployeeById(id) {
    const { data } = await apiClient.get(`/employees/${id}`)
    return data
  },

  /**
   * POST /employees
   * Accepts camelCase form data; maps to snake_case backend body.
   */
  async createEmployee(form) {
    const body = {
      first_name:    form.firstName,
      last_name:     form.lastName,
      date_of_birth: form.dateOfBirth,
      gender:        form.gender,
      email:         form.email,
      phone_number:  form.phoneNumber,
      address:       form.address,
      username:      form.username,
      position:      form.position,
      department:    form.department,
      jmbg:          form.jmbg,
    }
    const { data } = await apiClient.post('/employees', body)
    return data   // employeeResponse (Serbian fields)
  },

  /**
   * GET /employees/search?ime=&prezime=&email=&pozicija=
   */
  async searchEmployees({ firstName = '', lastName = '', email = '', position = '' } = {}) {
    const { data } = await apiClient.get('/employees/search', {
      params: {
        first_name: firstName,
        last_name:  lastName,
        email:      email,
        position:   position,
      },
    })
    return data   // { employees, total_count }
  },

  /**
   * PUT /employees/:id
   * Accepts camelCase form data; maps to snake_case backend body.
   */
  async updateEmployee(id, form) {
    const body = {
      first_name:    form.firstName,
      last_name:     form.lastName,
      date_of_birth: form.dateOfBirth,
      gender:        form.gender,
      email:         form.email,
      phone_number:  form.phoneNumber,
      address:       form.address,
      username:      form.username,
      position:      form.position,
      department:    form.department,
      active:        form.active,
      permissions:   dozvoleFromPermissions(form.permissions),
      jmbg:          form.jmbg,
    }
    const { data } = await apiClient.put(`/employees/${id}`, body)
    return data   // employeeResponse (Serbian fields)
  },
}
