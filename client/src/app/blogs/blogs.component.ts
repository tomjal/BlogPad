import { Component, OnInit } from '@angular/core';
import { Http, Headers, RequestOptions } from "@angular/http";
import { Router, ActivatedRoute } from "@angular/router";
import "rxjs/Rx";

@Component({
  selector: 'app-blogs',
  templateUrl: './blogs.component.html',
  styleUrls: ['./blogs.component.css']
})
export class BlogsComponent implements OnInit {

  private sid: string;
  public entries: Array<any>;

  public constructor(private http: Http, private router: Router, private route: ActivatedRoute) {
    this.entries = [];
  }

  public ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.sid = params["sid"];
      let headers = new Headers({ "authorization": "Bearer " + params["sid"] });
      let options = new RequestOptions({ headers: headers });
      this.http.get("http://localhost:3000/blogs", options)
        .map(result => result.json())
        .subscribe(result => {
          this.entries = result;
        });
    });
  }

  public create() {
    this.router.navigate(["/blog"], { "queryParams": { "sid": this.sid } });
  }
}
