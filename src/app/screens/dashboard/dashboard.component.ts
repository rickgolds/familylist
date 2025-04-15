import axios from 'axios';
import {RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {Meta} from '@angular/platform-browser';
import {Component, OnInit} from '@angular/core';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';

import {User} from '../../models/user.model';
import {Transaction} from '../../models/transaction.model';
import {FooterComponent} from '../../components/footer/footer.component';
import {HeaderComponent} from '../../components/header/header.component';
import {LoaderComponent} from '../../components/loader/loader.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FooterComponent,
    HeaderComponent,
    CommonModule,
    LoaderComponent,
    RouterLink,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  transactions: Transaction[] = [];

  usersIsLoading: boolean = true;
  transactionsIsLoading: boolean = true;

  operations = [
    {
      id: 1,
      line1: 'Receive',
      line2: 'Payment',
      icon: '/assets/svg/card.svg',
      route: '/create-invoice',
    },
    {
      id: 2,
      line1: 'Money',
      line2: 'Transfer',
      icon: '/assets/svg/repeat.svg',
      route: '/fund-transfer',
    },
    {
      id: 3,
      line1: 'Make a',
      line2: 'Payment',
      icon: '/assets/svg/dollar-sign.svg',
      route: '/payments',
    },
  ];

  cards = [
    {
      id: 1,
      card: '/assets/cards/03.png',
      route: '/card-details',
    },
    {
      id: 2,
      card: '/assets/cards/04.png',
      route: '/card-details',
    },
  ];

  constructor(private metaService: Meta) {}

  get loading(): boolean {
    return this.usersIsLoading || this.transactionsIsLoading;
  }

  getTransactions() {
    const url = 'https://george-fx.github.io/apitex_api/api/transactions.json';
    axios
      .get<{transactions: Transaction[]}>(url)
      .then((response) => {
        this.transactions = response.data.transactions;
        console.log('this.transactions', this.transactions);
        this.transactionsIsLoading = false;
      })
      .catch((error) => {
        console.error('Ошибка при получении данных:', error);
        this.transactionsIsLoading = false;
      });
  }

  getUsers() {
    const url = 'https://george-fx.github.io/apitex_api/api/users.json';
    axios
      .get<{users: User[]}>(url)
      .then((response) => {
        const users = [
          ...response.data.users,
          {
            id: response.data.users.length + 1,
            name: 'Choose',
            photo: '/assets/svg/plus.svg',
          },
        ];

        this.users = users;
        console.log('this.users', this.users);
        this.usersIsLoading = false;
      })
      .catch((error) => {
        console.error('Ошибка при получении данных:', error);
        this.usersIsLoading = false;
      });
  }

  ngOnInit(): void {
    this.getUsers();
    this.getTransactions();
    this.metaService.updateTag({name: 'theme-color', content: '#fff'});
    window.scrollTo(0, 0);
  }
}
