import { createContext, useContext, useState } from 'react'
import { employeeService } from '../services/employeeService'
import { employeeFromApi } from '../models/Employee'

const EmployeesContext = createContext()

export function EmployeesProvider({ children }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const { employees: raw } = await employeeService.getEmployees()
      setEmployees(raw.map(employeeFromApi))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  async function updateEmployee(id, updatedFields) {
    const raw = await employeeService.updateEmployee(id, updatedFields)
    const updated = employeeFromApi(raw)
    setEmployees((prev) => prev.map((emp) => emp.id === id ? updated : emp))
  }

  async function addEmployee(data) {
    const raw = await employeeService.createEmployee(data)
    const created = employeeFromApi(raw)
    setEmployees((prev) => [...prev, created])
    return created.id
  }

  return (
    <EmployeesContext.Provider value={{ employees, loading, error, reload, updateEmployee, addEmployee }}>
      {children}
    </EmployeesContext.Provider>
  )
}

export function useEmployees() {
  return useContext(EmployeesContext)
}
