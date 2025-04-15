import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, BehaviorSubject} from 'rxjs';
import {tap} from 'rxjs/operators';
import {jwtDecode} from 'jwt-decode';

import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      this.loadUserFromToken(token);
    }
  }

  signup(
    name: string,
    lastname: string,
    email: string,
    nickname: string,
    password: string,
    confirmPassword: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, {
      name,
      lastname,
      email,
      nickname,
      password,
      confirmPassword,
    });
  }

  signin(identifier: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signin`, {identifier, password}).pipe(
      tap((response: any) => {
        if (response.token) {
          this.loadUserFromToken(response.token);
        }
      })
    );
  }

  private loadUserFromToken(token: string): void {
    try {
      const decoded: any = jwtDecode(token);
      this.userSubject.next(decoded);
    } catch (error) {
      console.error('Błąd dekodowania tokena:', error);
      this.userSubject.next(null);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    this.userSubject.next(null);
  }

  getCurrentUser(): any {
    return this.userSubject.value;
  }

  getUsers(): Observable<any> {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get(`${this.apiUrl}/users`, {headers});
  }

  // Pobierz listy zadań
  getTaskLists(): Observable<any> {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('Pobrany token w getTaskLists:', token); // Dodaj log
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get(`${this.apiUrl}/task-lists`, {headers});
  }

  // Dodaj nową listę
  addTaskList(name: string): Observable<any> {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${this.apiUrl}/task-lists`, {name}, {headers});
  }

  // Edytuj nazwę listy
  updateTaskList(listId: number, name: string): Observable<any> {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put(
      `${this.apiUrl}/task-lists/${listId}`,
      {name},
      {headers}
    );
  }

  // Usuń listę
  deleteTaskList(listId: number): Observable<any> {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete(`${this.apiUrl}/task-lists/${listId}`, {headers});
  }

  // Pobierz zadania dla danej listy
  getTasks(listId: number): Observable<any> {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get(`${this.apiUrl}/tasks/${listId}`, {headers});
  }

  // Dodaj zadanie
  addTask(task: any): Observable<any> {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${this.apiUrl}/tasks`, task, {headers});
  }

  // Aktualizuj zadanie
  updateTask(taskId: number, task: any): Observable<any> {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put(`${this.apiUrl}/tasks/${taskId}`, task, {headers});
  }

  // Usuń zadanie
  deleteTask(taskId: number): Observable<any> {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete(`${this.apiUrl}/tasks/${taskId}`, {headers});
  }
}
