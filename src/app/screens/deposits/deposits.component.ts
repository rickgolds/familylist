import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Meta} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';

import {FooterComponent} from '../../components/footer/footer.component';
import {HeaderComponent} from '../../components/header/header.component';
import {ButtonComponent} from '../../components/button/button.component';
import {AuthService} from '../../auth.service';

@Component({
  selector: 'app-deposits',
  standalone: true,
  imports: [
    FooterComponent,
    HeaderComponent,
    CommonModule,
    ButtonComponent,
    FormsModule,
  ],
  templateUrl: './deposits.component.html',
  styleUrl: './deposits.component.scss',
})
export class DepositsComponent implements OnInit, OnDestroy {
  taskLists: any[] = [];
  tasks: any[] = [];
  users: any[] = [];
  selectedList: any = null;
  newTask = {
    title: '',
    description: '',
    assigned_to: null,
    list_id: null,
  };
  newListName: string | null = null;
  editList: any = null;
  editTask: any = null;
  private taskSubscription: Subscription | undefined;
  private listSubscription: Subscription | undefined;

  // Domyślne dzienne zadania
  defaultTasks: {title: string; description: string}[] = [
    {
      title: 'Posprzątaj salon',
      description: 'Uporządkuj salon przed rodzinnym spotkaniem.',
    },
    {
      title: 'Zrób zakupy spożywcze',
      description: 'Kup produkty na rodzinne wydarzenie.',
    },
    {
      title: 'Przygotuj śniadanie',
      description: 'Przygotuj śniadanie dla rodziny.',
    },
    {title: 'Wynieś śmieci', description: 'Wynieś śmieci z kuchni i łazienki.'},
    {
      title: 'Udekoruj stół',
      description: 'Przygotuj stół na rodzinne spotkanie.',
    },
  ];

  // Stan rozwinięcia sekcji "Dzienne zadania"
  showDefaultTasks: boolean = false;
  // Wybrane domyślne zadanie do przypisania
  selectedDefaultTask: {title: string; description: string} | null = null;
  // Wybrany użytkownik do przypisania zadania
  selectedUserForDefaultTask: number | null = null;

  constructor(private metaService: Meta, private authService: AuthService) {}

  ngOnInit(): void {
    this.metaService.updateTag({name: 'theme-color', content: '#fff'});
    window.scrollTo(0, 0);
    this.loadTaskLists();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    if (this.taskSubscription) {
      this.taskSubscription.unsubscribe();
    }
    if (this.listSubscription) {
      this.listSubscription.unsubscribe();
    }
  }

  loadTaskLists(): void {
    this.listSubscription = this.authService.getTaskLists().subscribe({
      next: (lists) => {
        this.taskLists = lists;
        if (lists.length > 0 && !this.selectedList) {
          this.selectList(lists[0]);
        }
      },
      error: (err) => {
        console.error('Błąd podczas pobierania list:', err);
      },
    });
  }

  loadTasks(listId: number): void {
    this.taskSubscription = this.authService.getTasks(listId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (err) => {
        console.error('Błąd podczas pobierania zadań:', err);
      },
    });
  }

  loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (err) => {
        console.error('Błąd podczas pobierania użytkowników:', err);
      },
    });
  }

  selectList(list: any): void {
    this.selectedList = list;
    this.newTask.list_id = list.id;
    this.loadTasks(list.id);
  }

  addTaskList(): void {
    if (!this.newListName) {
      alert('Nazwa listy jest wymagana!');
      return;
    }

    this.authService.addTaskList(this.newListName).subscribe({
      next: () => {
        this.loadTaskLists();
        this.newListName = null;
      },
      error: (err) => {
        console.error('Błąd podczas dodawania listy:', err);
      },
    });
  }

  startEditList(list: any): void {
    this.editList = {...list};
  }

  updateList(): void {
    if (!this.editList.name) {
      alert('Nazwa listy jest wymagana!');
      return;
    }

    this.authService
      .updateTaskList(this.editList.id, this.editList.name)
      .subscribe({
        next: () => {
          this.loadTaskLists();
          this.editList = null;
        },
        error: (err) => {
          console.error('Błąd podczas edycji listy:', err);
        },
      });
  }

  deleteList(listId: number): void {
    if (
      confirm('Czy na pewno chcesz usunąć tę listę i wszystkie jej zadania?')
    ) {
      this.authService.deleteTaskList(listId).subscribe({
        next: () => {
          this.loadTaskLists();
          this.selectedList = null;
          this.tasks = [];
        },
        error: (err) => {
          console.error('Błąd podczas usuwania listy:', err);
        },
      });
    }
  }

  addTask(): void {
    if (
      !this.newTask.title ||
      !this.newTask.assigned_to ||
      !this.newTask.list_id
    ) {
      alert('Tytuł, przypisany użytkownik i lista są wymagane!');
      return;
    }

    this.authService.addTask(this.newTask).subscribe({
      next: () => {
        this.loadTasks(this.newTask.list_id!);
        this.newTask = {
          title: '',
          description: '',
          assigned_to: null,
          list_id: this.newTask.list_id,
        };
      },
      error: (err) => {
        console.error('Błąd podczas dodawania zadania:', err);
      },
    });
  }

  startEdit(task: any): void {
    this.editTask = {...task};
  }

  updateTask(): void {
    if (!this.editTask.title || !this.editTask.assigned_to) {
      alert('Tytuł i przypisany użytkownik są wymagane!');
      return;
    }

    this.authService.updateTask(this.editTask.id, this.editTask).subscribe({
      next: () => {
        this.loadTasks(this.selectedList.id);
        this.editTask = null;
      },
      error: (err) => {
        console.error('Błąd podczas aktualizacji zadania:', err);
      },
    });
  }

  deleteTask(taskId: number): void {
    if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      this.authService.deleteTask(taskId).subscribe({
        next: () => {
          this.loadTasks(this.selectedList.id);
        },
        error: (err) => {
          console.error('Błąd podczas usuwania zadania:', err);
        },
      });
    }
  }

  toggleStatus(task: any): void {
    task.status = task.status === 'pending' ? 'completed' : 'pending';
    this.authService.updateTask(task.id, task).subscribe({
      next: () => {
        this.loadTasks(this.selectedList.id);
      },
      error: (err) => {
        console.error('Błąd podczas zmiany statusu zadania:', err);
      },
    });
  }

  // Rozwiń/zwiń sekcję "Dzienne zadania"
  toggleDefaultTasks(): void {
    this.showDefaultTasks = !this.showDefaultTasks;
  }

  // Wybierz domyślne zadanie i otwórz panel wyboru użytkownika
  selectDefaultTask(task: {title: string; description: string}): void {
    this.selectedDefaultTask = task;
    this.selectedUserForDefaultTask = null; // Reset wyboru użytkownika
  }

  // Dodaj domyślne zadanie do listy
  addDefaultTask(): void {
    if (
      !this.selectedDefaultTask ||
      !this.selectedUserForDefaultTask ||
      !this.selectedList
    ) {
      alert('Wybierz użytkownika i listę, aby dodać zadanie!');
      return;
    }

    const taskToAdd = {
      title: this.selectedDefaultTask.title,
      description: this.selectedDefaultTask.description,
      assigned_to: this.selectedUserForDefaultTask,
      list_id: this.selectedList.id,
    };

    this.authService.addTask(taskToAdd).subscribe({
      next: () => {
        this.loadTasks(this.selectedList.id);
        this.selectedDefaultTask = null; // Zamknij panel wyboru użytkownika
        this.selectedUserForDefaultTask = null;
      },
      error: (err) => {
        console.error('Błąd podczas dodawania domyślnego zadania:', err);
      },
    });
  }

  // Anuluj wybór domyślnego zadania
  cancelDefaultTask(): void {
    this.selectedDefaultTask = null;
    this.selectedUserForDefaultTask = null;
  }
}
