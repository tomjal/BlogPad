import { Component, OnInit } from '@angular/core';
import { Http, Headers, RequestOptions } from "@angular/http";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import "rxjs/Rx";

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit {

  private sid: string;
  public input: any;

  public constructor(private http: Http, private route: ActivatedRoute, private location: Location) {
    this.input = {
      "title": "",
      "content": ""
    };
  }

  public ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.sid = params["sid"];
    });
  }

  public save() {
    if (this.input.title && this.input.content) {
      let headers = new Headers({
        "content-type": "application/json",
        "authorization": "Bearer " + this.sid
      });
      let options = new RequestOptions({ headers: headers });
      this.http.post("http://localhost:3000/blog", JSON.stringify(this.input), options)
        .map(result => result.json())
        .subscribe(result => {
          this.location.back();
        });
    }
  }
}
