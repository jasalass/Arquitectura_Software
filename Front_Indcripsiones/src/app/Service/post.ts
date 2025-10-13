import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {

  private urlApi = "http://localhost:4000/auth";

  constructor(private httpClient: HttpClient) {}

  getPosts(): Observable<Post[]> {
    return this.httpClient.get<Post[]>(this.urlApi);
  }

  //definir la llamada al servicio
  //definir la interface que van a usar
  
}