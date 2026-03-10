import { Employee } from '../models/Employee'

const make = (data) => new Employee(data)

export const mockAdmin = make({
  id: 1, firstName: 'Admin', lastName: 'User', dateOfBirth: '1990-01-01',
  gender: 'M', email: 'admin@gmail.com', phoneNumber: '+381600000000',
  address: 'RAF Campus 1', username: 'admin', password: 'rafrafSI26',
  saltPassword: 'mockSalt', position: 'Administrator', department: 'IT', active: true,
  permissions: { canViewClients: true, canCreateAccounts: true, canApproveLoans: true, canProcessTransactions: true, canManageEmployees: true, canViewReports: true },
})

export const mockEmployees = [
  mockAdmin,
  make({
    id: 2, firstName: 'Ana', lastName: 'Marković', dateOfBirth: '1992-03-14',
    gender: 'F', email: 'ana.markovic@ankabanka.com', phoneNumber: '+381611234567',
    address: 'Knez Mihailova 12, Beograd', username: 'ana.markovic', password: 'password1',
    saltPassword: 'salt2', position: 'Teller', department: 'Retail Banking', active: true,
    permissions: { canViewClients: true, canProcessTransactions: true },
  }),
  make({
    id: 3, firstName: 'Nikola', lastName: 'Jovanović', dateOfBirth: '1988-07-22',
    gender: 'M', email: 'nikola.jovanovic@ankabanka.com', phoneNumber: '+381622345678',
    address: 'Terazije 5, Beograd', username: 'nikola.jovanovic', password: 'password2',
    saltPassword: 'salt3', position: 'Loan Officer', department: 'Finance', active: true,
    permissions: { canViewClients: true, canApproveLoans: true, canViewReports: true },
  }),
  make({
    id: 4, firstName: 'Milica', lastName: 'Petrović', dateOfBirth: '1995-11-05',
    gender: 'F', email: 'milica.petrovic@ankabanka.com', phoneNumber: '+381633456789',
    address: 'Nemanjina 22, Beograd', username: 'milica.petrovic', password: 'password3',
    saltPassword: 'salt4', position: 'Analyst', department: 'Risk Management', active: true,
    permissions: { canViewClients: true, canViewReports: true },
  }),
  make({
    id: 5, firstName: 'Stefan', lastName: 'Nikolić', dateOfBirth: '1985-02-18',
    gender: 'M', email: 'stefan.nikolic@ankabanka.com', phoneNumber: '+381644567890',
    address: 'Bulevar Oslobođenja 44, Novi Sad', username: 'stefan.nikolic', password: 'password4',
    saltPassword: 'salt5', position: 'Manager', department: 'Finance', active: false,
    permissions: { canViewClients: true, canApproveLoans: true, canCreateAccounts: true, canViewReports: true },
  }),
  make({
    id: 6, firstName: 'Jelena', lastName: 'Đorđević', dateOfBirth: '1993-09-30',
    gender: 'F', email: 'jelena.djordjevic@ankabanka.com', phoneNumber: '+381655678901',
    address: 'Trg Slobode 1, Novi Sad', username: 'jelena.djordjevic', password: 'password5',
    saltPassword: 'salt6', position: 'Compliance Officer', department: 'Legal', active: true,
    permissions: { canViewClients: true, canViewReports: true },
  }),
  make({
    id: 7, firstName: 'Marko', lastName: 'Stojanović', dateOfBirth: '1991-06-11',
    gender: 'M', email: 'marko.stojanovic@ankabanka.com', phoneNumber: '+381666789012',
    address: 'Vojvode Stepe 78, Beograd', username: 'marko.stojanovic', password: 'password6',
    saltPassword: 'salt7', position: 'IT Specialist', department: 'IT', active: true,
    permissions: { canViewReports: true, canManageEmployees: true },
  }),
  make({
    id: 8, firstName: 'Ivana', lastName: 'Lazić', dateOfBirth: '1997-04-25',
    gender: 'F', email: 'ivana.lazic@ankabanka.com', phoneNumber: '+381677890123',
    address: 'Cara Dušana 9, Niš', username: 'ivana.lazic', password: 'password7',
    saltPassword: 'salt8', position: 'Teller', department: 'Retail Banking', active: false,
    permissions: { canViewClients: true, canProcessTransactions: true },
  }),
]
