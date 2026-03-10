import { createContext, useContext, useState } from 'react'
import { mockEmployees } from '../mocks/employees'

const EmployeesContext = createContext()

export function EmployeesProvider({ children }) {
  const [employees, setEmployees] = useState(mockEmployees)

  function updateEmployee(id, updatedFields) {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? Object.assign(Object.create(Object.getPrototypeOf(emp)), emp, updatedFields) : emp
      )
    )
  }

  function addEmployee(data) {
    const nextId = Math.max(...employees.map((e) => e.id)) + 1
    const newEmp = Object.assign(Object.create(Object.getPrototypeOf(employees[0])), {
      ...data,
      id: nextId,
      password: '',
      saltPassword: '',
    })
    setEmployees((prev) => [...prev, newEmp])
    return nextId
  }

  return (
    <EmployeesContext.Provider value={{ employees, updateEmployee, addEmployee }}>
      {children}
    </EmployeesContext.Provider>
  )
}

export function useEmployees() {
  return useContext(EmployeesContext)
}
