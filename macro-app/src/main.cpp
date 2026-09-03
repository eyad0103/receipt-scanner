#include <iostream>
using namespace std;
int main() {
    int n;
    cin >> n;
    int arr[n];
    for(int i = 0; i < n; i++){
        cin >> arr[n];
    for(int i = 0; i < n; i++){
        if(arr[n+1] == arr[n-1]){
            cout << "YES<< endl;
        } else {
            cout << "NO" << endl;
            
        }
    }
}
// 1 - 2 - 3 - 4 - 5 -6
// 1 _ {0} 6_{5}