import {Component, OnInit} from '@angular/core';
import {YoutubeService} from '../../services/youtube.service';
import {combineLatest, Observable} from 'rxjs';
import {VideoModel} from '../../models/video';
import {FormBuilder, FormGroup} from '@angular/forms';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-youtube-list',
  templateUrl: './youtube-list.component.html',
  styleUrls: ['./youtube-list.component.sass']
})
export class YoutubeListComponent implements OnInit {
  public filteredVideosFromChanel: Observable<VideoModel[]>;
  public searchForm: FormGroup;
  private videos$ = this.ybService.videosList;
  private favouriteVideoIds: string[];

  constructor(private ybService: YoutubeService,
              private formBuilder: FormBuilder) {
    this.favouriteVideoIds = JSON.parse(localStorage.getItem('favIds')) || [];
  }

  ngOnInit() {
    this.initForm();
    const query$ = this.searchForm.valueChanges.pipe(startWith({search: '', showFavourites: false}));

    this.filteredVideosFromChanel = combineLatest(
      this.videos$, query$
    ).pipe(
      map(([videos, searchQuery]) =>
        !searchQuery.search && !searchQuery.showFavourites ? videos :
          searchQuery.showFavourites ? videos.filter(el => el.favourite === true) :
            videos.filter(el => el.title.toUpperCase().includes(searchQuery.search.toUpperCase()))
      )
    );

    if (this.favouriteVideoIds.length) {
      for (const id of this.favouriteVideoIds) {
        this.updateFavouriteStatus(id);
      }
    }
  }

  public loadMoreVideos() {
    this.ybService.loadMoreVideos();
    // @TODO add check if no mo videos in chanel
  }

  public toggleToFav(videoId: string) {
    this.saveFavouritesIds(videoId);
    this.updateFavouriteStatus(videoId);
  }

  private initForm() {
    this.searchForm = this.formBuilder.group({
      search: [''],
      showFavourites: [false]
    });
  }

  private updateFavouriteStatus(videoId: string) {
    this.videos$.forEach(el => {
      el.map((item: VideoModel) => {
        if (item.id === videoId) {
          item.favourite = !item.favourite;
        }
        return item;
      });
      return el;
    });
  }

  private saveFavouritesIds(videoId: string) {
    const index = this.favouriteVideoIds.indexOf(videoId);

    if (index < 0) {
      this.favouriteVideoIds.push(videoId);
    } else {
      this.favouriteVideoIds.splice(index, 1);
    }

    localStorage.setItem('favIds', JSON.stringify(this.favouriteVideoIds));
  }
}
