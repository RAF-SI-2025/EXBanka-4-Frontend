import { Client } from '../models/Client'

const make = (data) => new Client(data)

export const mockClients = [
  make({
    id: 1, firstName: 'Milana', lastName: 'Antonić', jmbg: '1801995785021',
    email: 'milana.antonic@gmail.com', phoneNumber: '+381601234567',
    address: 'Knez Mihailova 4, Beograd', dateOfBirth: '1995-01-18',
    gender: 'F', username: 'milana.antonic', active: true, bankAccounts: [],
  }),
  make({
    id: 2, firstName: 'Bojan', lastName: 'Đurić', jmbg: '2203988710034',
    email: 'bojan.djuric@gmail.com', phoneNumber: '+381612345678',
    address: 'Terazije 10, Beograd', dateOfBirth: '1988-03-22',
    gender: 'M', username: 'bojan.djuric', active: true, bankAccounts: [],
  }),
  make({
    id: 3, firstName: 'Katarina', lastName: 'Kostić', jmbg: '0507992785043',
    email: 'katarina.kostic@gmail.com', phoneNumber: '+381623456789',
    address: 'Vojvode Stepe 33, Beograd', dateOfBirth: '1992-07-05',
    gender: 'F', username: 'katarina.kostic', active: true, bankAccounts: [],
  }),
  make({
    id: 4, firstName: 'Aleksandra', lastName: 'Lazarević', jmbg: '1411990785054',
    email: 'aleksandra.lazarevic@gmail.com', phoneNumber: '+381634567890',
    address: 'Bulevar Oslobođenja 77, Novi Sad', dateOfBirth: '1990-11-14',
    gender: 'F', username: 'aleksandra.lazarevic', active: false, bankAccounts: [],
  }),
  make({
    id: 5, firstName: 'Nemanja', lastName: 'Milošević', jmbg: '0902985710065',
    email: 'nemanja.milosevic@gmail.com', phoneNumber: '+381645678901',
    address: 'Trg Slobode 2, Novi Sad', dateOfBirth: '1985-02-09',
    gender: 'M', username: 'nemanja.milosevic', active: true, bankAccounts: [],
  }),
  make({
    id: 6, firstName: 'Tanja', lastName: 'Savić', jmbg: '2608997785076',
    email: 'tanja.savic@gmail.com', phoneNumber: '+381656789012',
    address: 'Cara Dušana 15, Niš', dateOfBirth: '1997-08-26',
    gender: 'F', username: 'tanja.savic', active: true, bankAccounts: [],
  }),
]
